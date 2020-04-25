// @flow
import { Token, TokenType, type $TokenType } from "./Token.js";
import { Lox } from "./lox.js";
import { Expr } from "./Expr.js";
import { Stmt } from "./Stmt.js";

export class ParseError extends Error {}

export class Parser {
  tokens: Array<Token> = [];
  current = 0;

  constructor(tokens: Array<Token>) {
    this.tokens = tokens;
  }

  parse() {
    const statements = [];
    while (!this.isAtEnd()) {
      statements.push(this.declaration());
    }
    return statements;
  }

  match(...types: Array<$TokenType>) {
    for (const t of types) {
      if (this.check(t)) {
        this.advance();
        return true;
      }
    }

    return false;
  }
  check(type: $TokenType) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }
  advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }
  isAtEnd() {
    return this.peek().type === TokenType.EOF;
  }

  peek() {
    return this.tokens[this.current];
  }

  previous() {
    return this.tokens[this.current - 1];
  }
  consume(type: $TokenType, message: string) {
    if (this.check(type)) return this.advance();

    throw this.error(this.peek(), message);
  }
  error(token: Token, message: string) {
    Lox.error(token, message);
    return new ParseError();
  }
  synchronize() {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
        default:
          break;
      }

      this.advance();
    }
  }

  // Rules
  declaration(): ?Stmt {
    try {
      if (this.match(TokenType.VAR)) return this.varDeclaration();

      return this.statement();
    } catch (error) {
      if (error instanceof ParseError) {
        this.synchronize();
        return null;
      } else {
        throw error;
      }
    }
  }
  varDeclaration() {
    const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.");

    let initializer = null;
    if (this.match(TokenType.EQUAL)) {
      initializer = this.expression();
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
    return new Stmt.Var(name, initializer);
  }
  statement(): Stmt {
    if (this.match(TokenType.FOR)) return this.forStatement();
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.PRINT)) return this.printStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.LEFT_BRACE)) return new Stmt.Block(this.block());

    return this.expressionStatement();
  }
  block() {
    const statements: Array<Stmt> = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const stmt = this.declaration();
      if (stmt) { // if stmt is null, we synchronze
        statements.push(stmt);
      }
    }

    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
  }
  ifStatement() {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch = this.statement();
    let elseBranch = null;
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.statement();
    }

    return new Stmt.If(condition, thenBranch, elseBranch);
  }
  printStatement() {
    const value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return new Stmt.Print(value);
  }
  whileStatement() {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.");
    const body = this.statement();

    return new Stmt.While(condition, body);
  }

  forStatement() {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");

    let initializer;
    if (this.match(TokenType.SEMICOLON)) {
      initializer = null;
    } else if (this.match(TokenType.VAR)) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }
    let condition = null;
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

    let increment = null;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      increment = this.expression();
    }
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");

    let body = this.statement();

    if (increment != null) {
      body = new Stmt.Block([
        body,
        new Stmt.Expression(increment)
      ]);
    }

    if (condition == null) condition = new Expr.Literal(true);
    body = new Stmt.While(condition, body);

    if (initializer != null) {
      body = new Stmt.Block([initializer, body]);
    }

    return body;
  }

  expressionStatement() {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new Stmt.Expression(expr);
  }
  // expression → equality
  expression() {
    return this.assignment();
  }

  assignment() {
    const expr = this.or();

    if (this.match(TokenType.EQUAL)) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr instanceof Expr.Variable) {
        const name = expr.name;
        return new Expr.Assign(name, value);
      }

      this.error(equals, "Invalid assignment target.");
    }

    return expr;
  }

  or() {
    let expr = this.and();

    while (this.match(TokenType.OR)) {
      const operator = this.previous();
      const right = this.and();
      expr = new Expr.Logical(expr, operator, right);
    }

    return expr;
  }

  and() {
    let expr = this.equality();

    while (this.match(TokenType.AND)) {
      const operator = this.previous();
      const right = this.equality();
      expr = new Expr.Logical(expr, operator, right);
    }

    return expr;
  }

  // equality → comparison ( ( "!=" | "==" ) comparison )* ;
  equality() {
    let expr = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  // comparison → addition ( ( ">" | ">=" | "<" | "<=" ) addition )* ;
  comparison() {
    let expr = this.addition();

    while (
      this.match(
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL
      )
    ) {
      const operator = this.previous();
      const right = this.addition();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }
  // addition → multiplication ( ( "-" | "+" ) multiplication )* ;

  addition() {
    let expr = this.multiplication();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous();
      const right = this.multiplication();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }
  // multiplication → unary ( ( "/" | "*" ) unary )* ;

  multiplication() {
    let expr = this.unary();

    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.previous();
      const right = this.unary();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  // unary → ( "!" | "-" ) unary | primary ;
  unary() {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return new Expr.Unary(operator, right);
    }

    return this.primary();
  }

  // primary → NUMBER | STRING | "false" | "true" | "nil" | "(" expression ")" ;
  primary() {
    if (this.match(TokenType.FALSE)) return new Expr.Literal(false);
    if (this.match(TokenType.TRUE)) return new Expr.Literal(true);
    if (this.match(TokenType.NIL)) return new Expr.Literal(null);

    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new Expr.Literal(this.previous().literal);
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return new Expr.Variable(this.previous());
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new Expr.Grouping(expr);
    }
    throw this.error(this.peek(), "Expect expression.");
  }
}

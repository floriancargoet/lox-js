// @flow
import { Token, TokenType } from "./Token.js";
import { RuntimeError } from "./RuntimeError.js";
import { Lox } from "./lox.js";
import { Environment } from "./Environment.js";
import type { Expr, Visitor as ExprVisitor } from "./Expr.js";
import type { Stmt, Visitor as StmtVisitor } from "./Stmt.js";

export class Interpreter implements ExprVisitor<mixed>, StmtVisitor<null> {
  environment = new Environment();

  interpret(statements: Array<Stmt>) {
    try {
      for (const statement of statements) {
        this.execute(statement);
      }
    } catch (error) {
      if (error instanceof RuntimeError) {
        Lox.runtimeError(error);
      } else {
        throw error;
      }
    }
  }

  execute(stmt: Stmt) {
    stmt.accept(this);
  }

  executeBlock(statements: Array<Stmt>, environment: Environment) {
    const previous = this.environment;
    try {
      this.environment = environment;

      for (const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }

  evaluate(expr: Expr) {
    return expr.accept(this);
  }

  stringify(object: mixed): string {
    if (object == null) return "nil";
    return String(object);
  }

  isTruthy(object: mixed): boolean {
    if (object == null) return false;
    if (typeof object === "boolean") return object;
    return true;
  }

  isEqual(a: mixed, b: mixed): boolean {
    // nil is only equal to nil.
    if (a === null && b === null) return true;
    if (a === null) return false;

    return a === b;
  }

  checkNumberOperand(operator: Token, operand: mixed) {
    if (typeof operand === "number") return;
    throw new RuntimeError(operator, "Operand must be a number.");
  }

  checkNumberOperands(operator: Token, left: mixed, right: mixed) {
    if (typeof left === "number" && typeof right === "number") return;
    throw new RuntimeError(operator, "Operands must be numbers.");
  }

  visitBinaryExpr(expr: Expr.Binary) {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.PLUS:
        if (
          (typeof left === "number" && typeof right === "number") ||
          (typeof left === "string" && typeof right === "string")
        ) {
          return left + right;
        }
        throw new RuntimeError(
          expr.operator,
          "Operands must be two numbers or two strings."
        );
      case TokenType.MINUS:
        this.checkNumberOperands(expr.operator, left, right);
        // $flow-disable-line
        return left - right;
      case TokenType.SLASH:
        this.checkNumberOperands(expr.operator, left, right);
        // $flow-disable-line
        return left / right;
      case TokenType.STAR:
        this.checkNumberOperands(expr.operator, left, right);
        // $flow-disable-line
        return left * right;
      case TokenType.GREATER:
        this.checkNumberOperands(expr.operator, left, right);
        // $flow-disable-line
        return left > right;
      case TokenType.GREATER_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        // $flow-disable-line
        return left >= right;
      case TokenType.LESS:
        this.checkNumberOperands(expr.operator, left, right);
        // $flow-disable-line
        return left < right;
      case TokenType.LESS_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        // $flow-disable-line
        return left <= right;
      case TokenType.BANG_EQUAL:
        return !this.isEqual(left, right);
      case TokenType.EQUAL_EQUAL:
        return this.isEqual(left, right);
      default:
        // Unreachable.
        return null;
    }
  }

  visitGroupingExpr(expr: Expr.Grouping) {
    return this.evaluate(expr.expression);
  }

  visitLiteralExpr(expr: Expr.Literal) {
    return expr.value;
  }

  visitUnaryExpr(expr: Expr.Unary) {
    const right: mixed = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG:
        return !this.isTruthy(right);
      case TokenType.MINUS:
        this.checkNumberOperand(expr.operator, right);
        // $flow-disable-line
        return -right;
      default:
        // Unreachable.
        return null;
    }
  }

  visitExpressionStmt(stmt: Stmt.Expression) {
    this.evaluate(stmt.expression);
    return null;
  }

  visitPrintStmt(stmt: Stmt.Print) {
    const value = this.evaluate(stmt.expression);
    Lox.println(this.stringify(value));
    return null;
  }

  visitVariableExpr(expr: Expr.Variable) {
    return this.environment.get(expr.name);
  }

  visitVarStmt(stmt: Stmt.Var) {
    let value: mixed = null;
    if (stmt.initializer != null) {
      value = this.evaluate(stmt.initializer);
    }

    this.environment.define(stmt.name.lexeme, value);
    return null;
  }

  visitAssignExpr(expr: Expr.Assign) {
    const value = this.evaluate(expr.value);

    this.environment.assign(expr.name, value);
    return value;
  }

  visitBlockStmt(stmt: Stmt.Block) {
    this.executeBlock(stmt.statements, new Environment(this.environment));
    return null;
  }

  visitIfStmt(stmt: Stmt.If) {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch != null) {
      this.execute(stmt.elseBranch);
    }
    return null;
  }

  visitLogicalExpr(expr: Expr.Logical) {
    const left = this.evaluate(expr.left);

    if (expr.operator.type === TokenType.OR) {
      if (this.isTruthy(left)) return left;
    } else if (!this.isTruthy(left)) return left;

    return this.evaluate(expr.right);
  }

  visitWhileStmt(stmt: Stmt.While) {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
    return null;
  }
}

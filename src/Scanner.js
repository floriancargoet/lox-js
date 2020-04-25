// @flow
import { Token, TokenType, type $TokenType } from "./Token.js";
import { Lox } from "./lox.js";

export class Scanner {
  source: string = "";
  tokens: Array<Token> = [];

  start = 0;
  current = 0;
  line = 1;

  keywords: {[*]: $TokenType } = {
    and: TokenType.AND,
    class: TokenType.CLASS,
    else: TokenType.ELSE,
    false: TokenType.FALSE,
    for: TokenType.FOR,
    fun: TokenType.FUN,
    if: TokenType.IF,
    nil: TokenType.NIL,
    or: TokenType.OR,
    print: TokenType.PRINT,
    return: TokenType.RETURN,
    super: TokenType.SUPER,
    this: TokenType.THIS,
    true: TokenType.TRUE,
    var: TokenType.VAR,
    while: TokenType.WHILE
  };

  constructor(source: string) {
    this.source = source;
  }

  isAtEnd() {
    return this.current >= this.source.length;
  }

  scanTokens() {
    while (!this.isAtEnd()) {
      // We are at the beginning of the next lexeme.
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, "", null, this.line));
    return this.tokens;
  }

  scanToken() {
    const c = this.advance();
    switch (c) {
      // 1 char
      case "(":
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case ")":
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case "{":
        this.addToken(TokenType.LEFT_BRACE);
        break;
      case "}":
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      case ",":
        this.addToken(TokenType.COMMA);
        break;
      case ".":
        this.addToken(TokenType.DOT);
        break;
      case "-":
        this.addToken(TokenType.MINUS);
        break;
      case "+":
        this.addToken(TokenType.PLUS);
        break;
      case ";":
        this.addToken(TokenType.SEMICOLON);
        break;
      case "*":
        this.addToken(TokenType.STAR);
        break;

      // 1 or 2 chars
      case "!":
        this.addToken(this.match("=") ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      case "=":
        this.addToken(
          this.match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL
        );
        break;
      case "<":
        this.addToken(this.match("=") ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      case ">":
        this.addToken(
          this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER
        );
        break;

      case "/":
        if (this.match("/")) {
          // A comment goes until the end of the line.
          while (this.peek() !== "\n" && !this.isAtEnd()) this.advance();
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;

      case " ":
      case "\r":
      case "\t":
        // Ignore whitespace.
        break;

      case "\n":
        this.line++;
        break;

      case '"':
        this.string();
        break;

      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          Lox.error(this.line, "Unexpected character.");
        }
        break;
    }
  }

  advance() {
    this.current++;
    return this.source.charAt(this.current - 1);
  }

  match(expected: string) {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) !== expected) return false;

    this.current++;
    return true;
  }

  peek() {
    if (this.isAtEnd()) return "\0"; // FIXME: JS?
    return this.source.charAt(this.current);
  }
  peekNext() {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source.charAt(this.current + 1);
  }
  addToken(type: $TokenType, literal: mixed = null) {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(type, text, literal, this.line));
  }
  string() {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === "\n") this.line++;
      this.advance();
    }

    // Unterminated string.
    if (this.isAtEnd()) {
      Lox.error(this.line, "Unterminated string.");
      return;
    }

    // The closing ".
    this.advance();

    // Trim the surrounding quotes.
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, value);
  }
  isDigit(c: string) {
    return (
      c.charCodeAt(0) >= "0".charCodeAt(0) &&
      c.charCodeAt(0) <= "9".charCodeAt(0)
    );
  }
  number() {
    while (this.isDigit(this.peek())) this.advance();

    // Look for a fractional part.
    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      // Consume the "."
      this.advance();

      while (this.isDigit(this.peek())) this.advance();
    }

    this.addToken(
      TokenType.NUMBER,
      parseFloat(this.source.substring(this.start, this.current))
    );
  }
  identifier() {
    while (this.isAlphaNumeric(this.peek())) this.advance();
    const text = this.source.substring(this.start, this.current);

    let type = this.keywords[text];
    if (type == null) type = TokenType.IDENTIFIER;
    this.addToken(type);
  }
  isAlpha(c: string) {
    const code = c.charCodeAt(0);
    return (
      (code >= "a".charCodeAt(0) && code <= "z".charCodeAt(0)) ||
      (code >= "A".charCodeAt(0) && code <= "Z".charCodeAt(0)) ||
      c === "_"
    );
  }

  isAlphaNumeric(c: string) {
    return this.isAlpha(c) || this.isDigit(c);
  }
}

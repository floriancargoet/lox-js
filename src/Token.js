// @flow
// enum
export const TokenType = {};
[
  // Single-character tokens.
  "LEFT_PAREN",
  "RIGHT_PAREN",
  "LEFT_BRACE",
  "RIGHT_BRACE",
  "COMMA",
  "DOT",
  "MINUS",
  "PLUS",
  "SEMICOLON",
  "SLASH",
  "STAR",

  // One or two character tokens.
  "BANG",
  "BANG_EQUAL",
  "EQUAL",
  "EQUAL_EQUAL",
  "GREATER",
  "GREATER_EQUAL",
  "LESS",
  "LESS_EQUAL",

  // Literals.
  "IDENTIFIER",
  "STRING",
  "NUMBER",

  // Keywords.
  "AND",
  "CLASS",
  "ELSE",
  "FALSE",
  "FUN",
  "FOR",
  "IF",
  "NIL",
  "OR",
  "PRINT",
  "RETURN",
  "SUPER",
  "THIS",
  "TRUE",
  "VAR",
  "WHILE",

  "EOF"
].forEach(tokenType => {
  TokenType[tokenType] = tokenType;
});

export type $TokenType = $Values<typeof TokenType>;

export class Token {
  type: $Values<typeof TokenType>;
  lexeme: string;
  literal: mixed;
  line: number;

  constructor(
    type: $TokenType,
    lexeme: string,
    literal: mixed,
    line: number
  ) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.line = line;
  }

  toString() {
    return this.type + " " + this.lexeme + " " + String(this.literal);
  }
}

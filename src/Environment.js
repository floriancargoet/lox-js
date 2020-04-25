// @flow
import { Token } from "./Token.js";
import { RuntimeError } from "./RuntimeError.js";

export class Environment {
  enclosing: ?Environment;
  values: Map<string, mixed> = new Map<string, mixed>();

  constructor(enclosing: ?Environment) {
    this.enclosing = enclosing || null;
  }

  define(name: string, value: mixed) {
    this.values.set(name, value);
  }
  assign(name: Token, value: mixed) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }
    if (this.enclosing != null) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
  }
  get(name: Token): mixed {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme);
    }
    if (this.enclosing != null) return this.enclosing.get(name);

    throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
  }
}

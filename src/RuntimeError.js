// @flow
import type { Token } from "./Token.js";

export class RuntimeError extends Error {
  token = null;

  constructor(token: Token, message: string) {
    super(message);
    this.token = token;
  }
}

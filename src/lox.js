// @flow
/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import readline from "readline";
import { Scanner } from "./Scanner.js";
import { Token, TokenType } from "./Token.js";
import { Parser } from "./Parser.js";
import { Interpreter } from "./Interpreter.js";

export class Lox {
  // global flag set during lexing/parsing to prevent running the code
  static hadError = false;
  static hadRuntimeError = false;
  static interpreter = new Interpreter();

  static runFile(_path: string) {
    const source = fs.readFileSync(path.resolve(process.cwd(), _path), "utf8");
    Lox.run(source);
    // Indicate an error in the exit code.
    if (Lox.hadError) {
      process.exit(65);
    }
    if (Lox.hadRuntimeError) {
      process.exit(70);
    }
  }

  static runPrompt() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    function repl() {
      rl.question("> ", source => {
        if (source === "exit") {
          rl.close();
        } else {
          Lox.run(source);
          Lox.hadError = false;
          repl();
        }
      });
    }
    repl();
  }

  static run(source: string) {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    const parser = new Parser(tokens);
    const statements = parser.parse();

    // Stop if there was a syntax error.
    if (Lox.hadError) return;

    Lox.interpreter.interpret(statements);
  }

  static error(lineOrToken: number | Token, message: string) {
    if (typeof lineOrToken === "number") {
      Lox.report(lineOrToken, "", message);
    } else if (lineOrToken.type === TokenType.EOF) {
      Lox.report(lineOrToken.line, " at end", message);
    } else {
      Lox.report(lineOrToken.line, " at '" + lineOrToken.lexeme + "'", message);
    }
  }

  static runtimeError(error: Error & { token: Token }) {
    console.error(error.message + "\n[line " + error.token.line + "]");
    Lox.hadRuntimeError = true;
  }
  static report(line: number, where: string, message: string) {
    console.error("[line " + line + "] Error" + where + ": " + message);
    Lox.hadError = true;
  }

  static println(...args: Array<any>) {
    console.log(...args);
  }
}

const args = process.argv.slice(2);

if (args.length > 1) {
  console.log("Usage: lox [script]");
  process.exit(64);
} else if (args.length === 1) {
  Lox.runFile(args[0]);
} else {
  Lox.runPrompt();
}

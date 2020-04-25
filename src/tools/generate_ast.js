// @flow
import fs from "fs";
import path from "path";
import { generateAST } from "./generator.js";

const args = process.argv.slice(2);

if (args.length !== 1) {
  console.error("Usage: node generate_ast.js <output directory>");
  process.exit(1);
}

const outputDir = args[0];

function generateFile(baseName: string, types: Array<string>) {
  const _path = path.resolve(outputDir, baseName + ".js");
  const content = generateAST(baseName, types);
  fs.writeFileSync(_path, content, "utf8");
}

generateFile("Expr", [
  "Binary   -> left: Expr, operator: Token, right: Expr",
  "Grouping -> expression: Expr",
  "Literal  -> value: mixed",
  "Unary    -> operator: Token, right: Expr",
  "Variable -> name: Token",
  "Assign   -> name: Token, value: Expr",
  "Logical  -> left: Expr, operator: Token, right: Expr"
]);

generateFile("Stmt", [
  "Expression -> expression: Expr",
  "Print      -> expression: Expr",
  "Var        -> name: Token, initializer: ?Expr",
  "Block      -> statements: Array<Stmt>",
  "If         -> condition: Expr, thenBranch: Stmt, elseBranch: ?Stmt",
  "While      -> condition: Expr, body: Stmt"
]);

// @flow
import type { Token } from "./Token.js";
import type { Expr } from "./Expr.js";

export class Stmt {
  accept<R>(visitor: Visitor<R>): R {
    throw new Error("Subclasses must implement accept()");
  }
  static Expression = class Expression extends Stmt {
    expression: Expr;
    constructor(expression: Expr) {
      super();
      this.expression = expression;
    }
    accept<R>(visitor: Visitor<R>): R {
      return visitor.visitExpressionStmt(this);
    }
  };
  static Print = class Print extends Stmt {
    expression: Expr;
    constructor(expression: Expr) {
      super();
      this.expression = expression;
    }
    accept<R>(visitor: Visitor<R>): R {
      return visitor.visitPrintStmt(this);
    }
  };
  static Var = class Var extends Stmt {
    name: Token;
    initializer: ?Expr;
    constructor(name: Token, initializer: ?Expr) {
      super();
      this.name = name;
      this.initializer = initializer;
    }
    accept<R>(visitor: Visitor<R>): R {
      return visitor.visitVarStmt(this);
    }
  };
  static Block = class Block extends Stmt {
    statements: Array<Stmt>;
    constructor(statements: Array<Stmt>) {
      super();
      this.statements = statements;
    }
    accept<R>(visitor: Visitor<R>): R {
      return visitor.visitBlockStmt(this);
    }
  };
  static If = class If extends Stmt {
    condition: Expr;
    thenBranch: Stmt;
    elseBranch: ?Stmt;
    constructor(condition: Expr, thenBranch: Stmt, elseBranch: ?Stmt) {
      super();
      this.condition = condition;
      this.thenBranch = thenBranch;
      this.elseBranch = elseBranch;
    }
    accept<R>(visitor: Visitor<R>): R {
      return visitor.visitIfStmt(this);
    }
  };
  static While = class While extends Stmt {
    condition: Expr;
    body: Stmt;
    constructor(condition: Expr, body: Stmt) {
      super();
      this.condition = condition;
      this.body = body;
    }
    accept<R>(visitor: Visitor<R>): R {
      return visitor.visitWhileStmt(this);
    }
  };
}

export interface Visitor<R> {
  visitExpressionStmt(stmt: Stmt.Expression): R;
  visitPrintStmt(stmt: Stmt.Print): R;
  visitVarStmt(stmt: Stmt.Var): R;
  visitBlockStmt(stmt: Stmt.Block): R;
  visitIfStmt(stmt: Stmt.If): R;
  visitWhileStmt(stmt: Stmt.While): R;
}

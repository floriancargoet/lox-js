// @flow
import type { Token } from "./Token.js";


export class Expr {
  accept<R>(visitor: Visitor<R>): R {
    throw new Error("Subclasses must implement accept()");
  }
  static Binary = class Binary extends Expr {
    left: Expr;
    operator: Token;
    right: Expr;
    constructor(left: Expr, operator: Token, right: Expr) {
      super();
      this.left = left;
      this.operator = operator;
      this.right = right;
    }
    accept<R>(visitor: Visitor<R>): R {
      return visitor.visitBinaryExpr(this);
    }
  };
  static Grouping = class Grouping extends Expr {
    expression: Expr;
    constructor(expression: Expr) {
      super();
      this.expression = expression;
    }
    accept<R>(visitor: Visitor<R>): R {
      return visitor.visitGroupingExpr(this);
    }
  };
  static Literal = class Literal extends Expr {
    value: mixed;
    constructor(value: mixed) {
      super();
      this.value = value;
    }
    accept<R>(visitor: Visitor<R>): R {
      return visitor.visitLiteralExpr(this);
    }
  };
  static Unary = class Unary extends Expr {
    operator: Token;
    right: Expr;
    constructor(operator: Token, right: Expr) {
      super();
      this.operator = operator;
      this.right = right;
    }
    accept<R>(visitor: Visitor<R>): R {
      return visitor.visitUnaryExpr(this);
    }
  };
  static Variable = class Variable extends Expr {
    name: Token;
    constructor(name: Token) {
      super();
      this.name = name;
    }
    accept<R>(visitor: Visitor<R>): R {
      return visitor.visitVariableExpr(this);
    }
  };
  static Assign = class Assign extends Expr {
    name: Token;
    value: Expr;
    constructor(name: Token, value: Expr) {
      super();
      this.name = name;
      this.value = value;
    }
    accept<R>(visitor: Visitor<R>): R {
      return visitor.visitAssignExpr(this);
    }
  };
  static Logical = class Logical extends Expr {
    left: Expr;
    operator: Token;
    right: Expr;
    constructor(left: Expr, operator: Token, right: Expr) {
      super();
      this.left = left;
      this.operator = operator;
      this.right = right;
    }
    accept<R>(visitor: Visitor<R>): R {
      return visitor.visitLogicalExpr(this);
    }
  };
}

export interface Visitor<R> {
  visitBinaryExpr(expr: Expr.Binary): R;
  visitGroupingExpr(expr: Expr.Grouping): R;
  visitLiteralExpr(expr: Expr.Literal): R;
  visitUnaryExpr(expr: Expr.Unary): R;
  visitVariableExpr(expr: Expr.Variable): R;
  visitAssignExpr(expr: Expr.Assign): R;
  visitLogicalExpr(expr: Expr.Logical): R;
}

// @flow
import type { Expr, Visitor as ExprVisitor } from "./Expr.js";

export class AstPrinter implements ExprVisitor<string> {
  print(expr: Expr) {
    return expr.accept(this);
  }
  parenthesize(name: string, ...exprs: Array<Expr>) {
    return `(${name}${exprs.map(expr => ` ${expr.accept(this)}`).join("")})`;
  }

  visitBinaryExpr(expr: Expr.Binary) {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitGroupingExpr(expr: Expr.Grouping) {
    return this.parenthesize("group", expr.expression);
  }

  visitLiteralExpr(expr: Expr.Literal) {
    if (expr.value == null) return "nil";
    return String(expr.value);
  }

  visitUnaryExpr(expr: Expr.Unary) {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  visitAssignExpr(expr: Expr.Assign) {
    return "not implemented";
  }

  visitLogicalExpr(expr: Expr.Logical) {
    return "not implemented";
  }

  visitVariableExpr(expr: Expr.Variable) {
    return "not implemented";
  }
}

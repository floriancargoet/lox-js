// @flow
import { code } from "./code_template.js";

type FieldInfo = {
  name: string,
  nameAndType: string
};

function generateType(baseName: string, className: string, fieldList: string) {
  const fields = fieldList
    .split(",")
    .map(f => ({
      nameAndType: f.trim(),
      name: f.split(":")[0].trim()
    }));
  return code`
static ${className} = class ${className} extends ${baseName} {
  ${fields.map((f: FieldInfo) => `${f.nameAndType};`)}
  constructor(${fieldList}) {
    super();
    ${fields.map((f: FieldInfo) => `this.${f.name} = ${f.name};`)}
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visit${className + baseName}(this);
  }
};`;
}

export function generateAST(
  baseName: string,
  types: Array<string>
) {
  return code`
// @flow
import type { Token } from "./Token.js";
${baseName === "Stmt" ? 'import type { Expr } from "./Expr.js";' : ""}

export class ${baseName} {
  accept<R>(visitor: Visitor<R>): R {
    throw new Error("Subclasses must implement accept()");
  }
  ${types.map(type => {
    const className = type.split("->")[0].trim();
    const fields = type.split("->")[1].trim();
    return generateType(baseName, className, fields);
  })}
}

export interface Visitor<R> {
  ${types.map(type => {
    const typeName = type.split("->")[0].trim();
    return `visit${typeName +
      baseName}(${baseName.toLowerCase()}: ${baseName}.${typeName}): R;`;
  })}
}
`;
}

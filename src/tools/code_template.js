// @flow

function computeCurrentIndentation(str: string) {
    // count the number of spaces after the last \n
    const matches = str.match(/(^|\n)( *)$/);
    if (matches) {
        return matches[2];
    }
    return "";
}

function applyIndentation(indent: string, str: mixed | Array<mixed>) {
    let lines: Array<string>;
    if (Array.isArray(str)) {
        lines = str.flatMap(s => String(s).split("\n"));
    }
    else {
        lines = String(str).split("\n");
    }
    return lines.map((line, i) => {
        if (i === 0) return line;
        return indent + line;
    }).join("\n");
}

export function code(strs: Array<string>, ...variables: Array<mixed | Array<mixed>>) {
    // copy strings for mutation
    const strings = [...strs];
    const parts: Array<string> = [];
    // drop first empty line
    if (strings[0].charAt(0) === "\n") {
        strings[0] = strings[0].slice(1);
    }
    for (let i = 0; i < variables.length; i++) {
        const indent = computeCurrentIndentation(strings[i]);
        const variable = applyIndentation(indent, variables[i]);
        parts.push(strings[i], variable);
    }
    // add last string
    parts.push(strings[strings.length - 1]);
    return parts.join("");
}

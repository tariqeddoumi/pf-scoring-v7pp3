export type ExpressionValue = string | number | boolean | null;
export type ExpressionContext = Record<string, unknown>;

interface Token {
  type: "number" | "string" | "identifier" | "operator" | "paren" | "boolean" | "null";
  value: string;
}

const OPERATORS = new Set(["&&", "||", "==", "!=", ">=", "<=", ">", "<", "+", "-", "*", "/", "!", "(", ")"]);

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expression.length) {
    const char = expression[i];
    if (/\s/.test(char)) {
      i += 1;
      continue;
    }

    const two = expression.slice(i, i + 2);
    if (OPERATORS.has(two)) {
      tokens.push({ type: "operator", value: two });
      i += 2;
      continue;
    }

    if (char === "(" || char === ")") {
      tokens.push({ type: "paren", value: char });
      i += 1;
      continue;
    }

    if (OPERATORS.has(char)) {
      tokens.push({ type: "operator", value: char });
      i += 1;
      continue;
    }

    if (char === '"' || char === "'") {
      const quote = char;
      let value = "";
      i += 1;
      while (i < expression.length && expression[i] !== quote) {
        value += expression[i];
        i += 1;
      }
      if (expression[i] !== quote) throw new Error("Unterminated string literal");
      tokens.push({ type: "string", value });
      i += 1;
      continue;
    }

    if (/\d/.test(char) || (char === "." && /\d/.test(expression[i + 1] ?? ""))) {
      let value = char;
      i += 1;
      while (i < expression.length && /[\d.]/.test(expression[i])) {
        value += expression[i];
        i += 1;
      }
      tokens.push({ type: "number", value });
      continue;
    }

    if (/[A-Za-z_]/.test(char)) {
      let value = char;
      i += 1;
      while (i < expression.length && /[A-Za-z0-9_.]/.test(expression[i])) {
        value += expression[i];
        i += 1;
      }
      if (value === "true" || value === "false") {
        tokens.push({ type: "boolean", value });
      } else if (value === "null") {
        tokens.push({ type: "null", value });
      } else {
        tokens.push({ type: "identifier", value });
      }
      continue;
    }

    throw new Error(`Unsupported token at position ${i}`);
  }

  return tokens;
}

function resolveIdentifier(path: string, context: ExpressionContext): ExpressionValue {
  const value = path.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, context);

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
    return value;
  }
  if (value === undefined) return null;
  throw new Error(`Identifier ${path} does not resolve to a scalar value`);
}

function toNumber(value: ExpressionValue): number {
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return 0;
}

function toBoolean(value: ExpressionValue): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.length > 0;
  return false;
}

class Parser {
  private index = 0;

  constructor(private readonly tokens: Token[], private readonly context: ExpressionContext) {}

  parse(): ExpressionValue {
    const value = this.parseOr();
    if (this.peek()) throw new Error("Unexpected trailing token");
    return value;
  }

  private parseOr(): ExpressionValue {
    let left = this.parseAnd();
    while (this.match("||")) {
      const right = this.parseAnd();
      left = toBoolean(left) || toBoolean(right);
    }
    return left;
  }

  private parseAnd(): ExpressionValue {
    let left = this.parseEquality();
    while (this.match("&&")) {
      const right = this.parseEquality();
      left = toBoolean(left) && toBoolean(right);
    }
    return left;
  }

  private parseEquality(): ExpressionValue {
    let left = this.parseComparison();
    while (true) {
      if (this.match("==")) {
        const right = this.parseComparison();
        left = left === right;
      } else if (this.match("!=")) {
        const right = this.parseComparison();
        left = left !== right;
      } else {
        return left;
      }
    }
  }

  private parseComparison(): ExpressionValue {
    let left = this.parseTerm();
    while (true) {
      if (this.match(">=")) left = toNumber(left) >= toNumber(this.parseTerm());
      else if (this.match("<=")) left = toNumber(left) <= toNumber(this.parseTerm());
      else if (this.match(">")) left = toNumber(left) > toNumber(this.parseTerm());
      else if (this.match("<")) left = toNumber(left) < toNumber(this.parseTerm());
      else return left;
    }
  }

  private parseTerm(): ExpressionValue {
    let left = this.parseFactor();
    while (true) {
      if (this.match("+")) left = toNumber(left) + toNumber(this.parseFactor());
      else if (this.match("-")) left = toNumber(left) - toNumber(this.parseFactor());
      else return left;
    }
  }

  private parseFactor(): ExpressionValue {
    let left = this.parseUnary();
    while (true) {
      if (this.match("*")) left = toNumber(left) * toNumber(this.parseUnary());
      else if (this.match("/")) left = toNumber(left) / toNumber(this.parseUnary());
      else return left;
    }
  }

  private parseUnary(): ExpressionValue {
    if (this.match("!")) return !toBoolean(this.parseUnary());
    if (this.match("-")) return -toNumber(this.parseUnary());
    return this.parsePrimary();
  }

  private parsePrimary(): ExpressionValue {
    const token = this.advance();
    if (!token) throw new Error("Unexpected end of expression");

    if (token.type === "number") return Number(token.value);
    if (token.type === "string") return token.value;
    if (token.type === "boolean") return token.value === "true";
    if (token.type === "null") return null;
    if (token.type === "identifier") return resolveIdentifier(token.value, this.context);

    if (token.value === "(") {
      const value = this.parseOr();
      if (!this.match(")")) throw new Error("Expected closing parenthesis");
      return value;
    }

    throw new Error(`Unexpected token ${token.value}`);
  }

  private match(value: string): boolean {
    if (this.peek()?.value !== value) return false;
    this.index += 1;
    return true;
  }

  private advance(): Token | undefined {
    const token = this.tokens[this.index];
    this.index += 1;
    return token;
  }

  private peek(): Token | undefined {
    return this.tokens[this.index];
  }
}

export function evaluateSafeExpression(expression: string, context: ExpressionContext): ExpressionValue {
  const trimmed = expression.trim();
  if (!trimmed) return false;
  if (trimmed.toLowerCase() === "always") return true;
  if (trimmed.toLowerCase() === "never") return false;
  return new Parser(tokenize(trimmed), context).parse();
}

export function evaluateSafeBooleanExpression(expression: string, context: ExpressionContext): boolean {
  return toBoolean(evaluateSafeExpression(expression, context));
}

export function evaluateSafeNumericExpression(expression: string, context: ExpressionContext): number {
  return toNumber(evaluateSafeExpression(expression, context));
}

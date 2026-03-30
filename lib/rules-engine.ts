export type RuleSeverity = "INFO" | "RED_FLAG" | "NO_GO";

export type RuntimeRule = {
  code: string;
  title: string;
  severity: RuleSeverity;
  expression: string;
  outcome: string;
};

export type RuleDecision = {
  code: string;
  title: string;
  severity: RuleSeverity;
  matched: boolean;
  outcome: string;
};

function numeric(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function compare(left: unknown, op: string, right: unknown) {
  const ln = numeric(left);
  const rn = numeric(right);

  if (["<", "<=", ">", ">="].includes(op)) {
    switch (op) {
      case "<": return ln < rn;
      case "<=": return ln <= rn;
      case ">": return ln > rn;
      case ">=": return ln >= rn;
    }
  }

  const ls = String(left ?? "").trim().replace(/^['"]|['"]$/g, "");
  const rs = String(right ?? "").trim().replace(/^['"]|['"]$/g, "");

  if (op === "=" || op === "==") return ls === rs;
  if (op === "!=") return ls !== rs;
  return false;
}

export function evaluateExpression(expression: string, payload: Record<string, unknown>) {
  const normalized = expression.replace(/\s+/g, " ").trim();
  const match = normalized.match(/^([A-Z0-9_]+)\s*(<=|>=|=|==|!=|<|>)\s*(.+)$/i);
  if (!match) return false;
  const [, field, op, rawRight] = match;
  const left = payload[field];
  const right = rawRight;
  return compare(left, op, right);
}

export function runRules(rules: RuntimeRule[], payload: Record<string, unknown>): RuleDecision[] {
  return rules.map((rule) => ({
    code: rule.code,
    title: rule.title,
    severity: rule.severity,
    matched: evaluateExpression(rule.expression, payload),
    outcome: rule.outcome,
  }));
}

export function hasNoGo(decisions: RuleDecision[]) {
  return decisions.some((item) => item.severity === "NO_GO" && item.matched);
}

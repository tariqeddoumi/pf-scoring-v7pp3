export type ScoringGranularityLevel = "CRITERION" | "SUB_CRITERION" | "SUB_SUB_CRITERION";

export interface RuntimeValueListItem {
  id: string;
  code: string | null;
  label: string;
  value: string | null;
  score: number | null;
  orderIndex: number;
  isActive: boolean;
  color?: string | null;
  metadataJson?: string | null;
}

export interface RuntimeRangeItem {
  id: string;
  label: string | null;
  minValue: number;
  maxValue: number;
  score: number | null;
  orderIndex: number;
  isActive: boolean;
}

export interface RuntimeScoringNode {
  id: string;
  versionId: string;
  parentNodeId: string | null;
  nodeType: string;
  code: string;
  label: string;
  description: string | null;
  depth: number;
  orderIndex: number;
  isActive: boolean;
  isTerminal: boolean;
  isScored: boolean;
  isMandatory: boolean;
  weight: number | null;
  weightMode: string | null;
  answerType: string | null;
  scoringMethod: string | null;
  aggregationMethod: string | null;
  configuredScoringLevel: ScoringGranularityLevel;
  valueList: RuntimeValueListItem[];
  ranges: RuntimeRangeItem[];
  metadataJson: string | null;
  uiSchemaJson: string | null;
  children: RuntimeScoringNode[];
}

export interface RuntimeScoringRule {
  id: string;
  nodeId: string | null;
  ruleType: string;
  code: string;
  label: string;
  severity: string;
  actionType: string;
  penaltyValue: number | null;
  blocking: boolean;
  conditionExpression: string;
  messageUser: string | null;
  isActive: boolean;
}

export interface RuntimeScoringModel {
  modelId: string;
  modelCode: string;
  modelLabel: string;
  versionId: string;
  versionLabel: string;
  versionNumber: number;
  effectiveDate: string | null;
  rootScoringLevel: ScoringGranularityLevel;
  includedDomainIds: string[];
  nodes: RuntimeScoringNode[];
  rules: RuntimeScoringRule[];
}

export interface RuntimeAnswerPayload {
  nodeId: string;
  valueString?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  valueDate?: string | null;
  manualScore?: number | null;
}

export interface RuntimeNodeScore {
  nodeId: string;
  code: string;
  rawScore: number;
  weightedScore: number;
  weightApplied: number;
  scoringMethod: string | null;
  aggregationMethod: string | null;
  level: ScoringGranularityLevel;
}

export interface RuntimeScoreResult {
  versionId: string;
  globalScore: number;
  domainScores: RuntimeNodeScore[];
  nodeScores: RuntimeNodeScore[];
  alerts: Array<{ code: string; message: string; severity: "INFO" | "WARNING" | "CRITICAL" }>;
  decision: {
    status: "APPROVE" | "REVIEW" | "REJECT";
    reason: string;
  };
  triggeredRules: Array<{
    ruleId: string;
    code: string;
    severity: string;
    actionType: string;
    message: string | null;
  }>;
}

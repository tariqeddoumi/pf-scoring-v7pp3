import { ScoringRuntimeService } from "@/lib/services/scoring-runtime-service";
import { RuntimeScoringModel } from "@/lib/scoring-runtime-contract";

const baseModel: RuntimeScoringModel = {
  modelId: "m1",
  modelCode: "PF",
  modelLabel: "PF",
  versionId: "v1",
  versionLabel: "v1",
  versionNumber: 1,
  effectiveDate: null,
  rootScoringLevel: "SUB_SUB_CRITERION",
  includedDomainIds: ["d1"],
  rules: [],
  nodes: [
    {
      id: "d1",
      versionId: "v1",
      parentNodeId: null,
      nodeType: "DOMAIN",
      code: "D1",
      label: "Domain 1",
      description: null,
      depth: 0,
      orderIndex: 1,
      isActive: true,
      isTerminal: false,
      isScored: false,
      isMandatory: false,
      weight: 100,
      weightMode: "RELATIVE",
      answerType: null,
      scoringMethod: null,
      aggregationMethod: "WEIGHTED_AVERAGE",
      configuredScoringLevel: "SUB_SUB_CRITERION",
      valueList: [],
      ranges: [],
      metadataJson: null,
      uiSchemaJson: null,
      children: [
        {
          id: "c1",
          versionId: "v1",
          parentNodeId: "d1",
          nodeType: "CRITERION",
          code: "C1",
          label: "Crit 1",
          description: null,
          depth: 1,
          orderIndex: 1,
          isActive: true,
          isTerminal: true,
          isScored: true,
          isMandatory: false,
          weight: 60,
          weightMode: "RELATIVE",
          answerType: "OPTION_SINGLE",
          scoringMethod: "OPTION_SCORE",
          aggregationMethod: null,
          configuredScoringLevel: "CRITERION",
          valueList: [
            { id: "o1", code: "LOW", label: "Low", value: "LOW", score: 2, orderIndex: 1, isActive: true },
            { id: "o2", code: "HIGH", label: "High", value: "HIGH", score: 8, orderIndex: 2, isActive: true },
          ],
          ranges: [],
          metadataJson: null,
          uiSchemaJson: null,
          children: [],
        },
        {
          id: "c2",
          versionId: "v1",
          parentNodeId: "d1",
          nodeType: "CRITERION",
          code: "C2",
          label: "Crit 2",
          description: null,
          depth: 1,
          orderIndex: 2,
          isActive: true,
          isTerminal: true,
          isScored: true,
          isMandatory: false,
          weight: 40,
          weightMode: "RELATIVE",
          answerType: "NUMERIC_RANGE",
          scoringMethod: "RANGE_SCORE",
          aggregationMethod: null,
          configuredScoringLevel: "CRITERION",
          valueList: [],
          ranges: [
            { id: "r1", label: "bad", minValue: 0, maxValue: 49, score: 2, orderIndex: 1, isActive: true },
            { id: "r2", label: "good", minValue: 50, maxValue: 100, score: 9, orderIndex: 2, isActive: true },
          ],
          metadataJson: null,
          uiSchemaJson: null,
          children: [],
        },
      ],
    },
  ],
};

describe("ScoringRuntimeService.evaluateAnswers", () => {
  it("calculates weighted score from configured hierarchy", () => {
    const result = ScoringRuntimeService.evaluateAnswers(baseModel, [
      { nodeId: "c1", valueString: "HIGH" },
      { nodeId: "c2", valueNumber: 80 },
    ]);

    expect(result.globalScore).toBeCloseTo(8.4, 6);
    expect(result.domainScores[0].rawScore).toBeCloseTo(8.4, 6);
  });

  it("detects NO_GO decision when blocking always-rule is active", () => {
    const modelWithRule: RuntimeScoringModel = {
      ...baseModel,
      rules: [
        {
          id: "rule1",
          nodeId: null,
          ruleType: "NO_GO",
          code: "NO_GO_1",
          label: "No Go",
          severity: "CRITICAL",
          actionType: "BLOCK",
          penaltyValue: null,
          blocking: true,
          conditionExpression: "always",
          messageUser: "No-go triggered",
          isActive: true,
        },
      ],
    };

    const result = ScoringRuntimeService.evaluateAnswers(modelWithRule, [
      { nodeId: "c1", valueString: "HIGH" },
      { nodeId: "c2", valueNumber: 80 },
    ]);

    expect(result.decision.status).toBe("REJECT");
    expect(result.triggeredRules).toHaveLength(1);
  });

  it("raises warning when weights are inconsistent", () => {
    const badWeightModel: RuntimeScoringModel = {
      ...baseModel,
      nodes: [
        {
          ...baseModel.nodes[0],
          children: [
            { ...baseModel.nodes[0].children[0], weight: 30 },
            { ...baseModel.nodes[0].children[1], weight: 30 },
          ],
        },
      ],
    };

    const result = ScoringRuntimeService.evaluateAnswers(badWeightModel, [
      { nodeId: "c1", valueString: "LOW" },
      { nodeId: "c2", valueNumber: 80 },
    ]);

    expect(result.alerts.some((alert) => alert.code === "WEIGHT_SUM_WARNING")).toBe(true);
  });
});

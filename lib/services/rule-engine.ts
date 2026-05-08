import prisma from "@/lib/prisma-client";
import { evaluateSafeBooleanExpression } from "@/lib/services/safe-expression-engine";
import { ScoringNodeRule } from "@prisma/client";

/**
 * Rule evaluation context
 */
export interface RuleContext {
  evaluationId: string;
  nodeId: string;
  nodeScore: number;
  projectData?: Record<string, unknown>;
  evaluationData?: Record<string, unknown>;
  allAnswers?: Map<string, unknown>;
}

/**
 * Rule evaluation result
 */
export interface RuleEvaluation {
  ruleId: string;
  ruleCode: string;
  ruleType: string;
  triggered: boolean;
  severity: string;
  actionType: string;
  penalty: number;
  blocking: boolean;
  message: string;
  messageUser?: string;
  messageCommittee?: string;
}

/**
 * Rule engine for evaluating scoring rules
 */
export class RuleEngine {
  /**
   * Evaluate all rules for a version
   */
  static async evaluateRulesForVersion(
    versionId: string,
    context: RuleContext
  ): Promise<RuleEvaluation[]> {
    const rules = await prisma.scoringNodeRule.findMany({
      where: { versionId, isActive: true },
      orderBy: { orderIndex: "asc" },
    });

    const evaluations: RuleEvaluation[] = [];

    for (const rule of rules) {
      const evaluation = await this.evaluateRule(rule, context);
      if (evaluation) {
        evaluations.push(evaluation);
      }
    }

    return evaluations;
  }

  /**
   * Evaluate a single rule
   */
  static async evaluateRule(
    rule: ScoringNodeRule,
    context: RuleContext
  ): Promise<RuleEvaluation | null> {
    try {
      // Evaluate rule condition
      const triggered = await this.evaluateCondition(
        rule.conditionExpression || "",
        context
      );

      if (!triggered) {
        return null;
      }

      return {
        ruleId: rule.id,
        ruleCode: rule.code,
        ruleType: rule.ruleType,
        triggered: true,
        severity: rule.severity || "MEDIUM",
        actionType: rule.actionType || "BLOCK",
        penalty: rule.penaltyValue || 0,
        blocking: rule.blocking || false,
        message: rule.description || "",
        messageUser: rule.messageUser ?? undefined,
        messageCommittee: rule.messageCommittee ?? undefined,
      };
    } catch (error) {
      console.error(`Error evaluating rule ${rule.code}:`, error);
      return null;
    }
  }

  /**
   * Evaluate rule condition using safe expression evaluation
   */
  private static async evaluateCondition(
    expression: string,
    context: RuleContext
  ): Promise<boolean> {
    if (!expression) return false;

    try {
      const answers = context.allAnswers
        ? Object.fromEntries(context.allAnswers.entries())
        : {};

      return evaluateSafeBooleanExpression(expression, {
        score: context.nodeScore,
        nodeId: context.nodeId,
        evaluationId: context.evaluationId,
        project: context.projectData ?? {},
        evaluation: context.evaluationData ?? {},
        answers,
        ...(context.projectData ?? {}),
        ...(context.evaluationData ?? {}),
      });
    } catch (error) {
      console.error("Error evaluating condition:", error);
      return false;
    }
  }

  /**
   * Classify rule by type for different handling
   */
  static getRuleTypeCategory(ruleType: string): string {
    switch (ruleType) {
      case "HARD_STOP":
      case "NO_GO":
        return "BLOCKING";

      case "MALUS":
        return "PENALTY";

      case "WARNING":
      case "REQUIRE_REVIEW":
        return "WARNING";

      case "VISIBILITY":
      case "MANDATORY_IF":
        return "VISIBILITY";

      case "BLOCK_PUBLICATION":
        return "PUBLICATION_BLOCK";

      default:
        return "OTHER";
    }
  }

  /**
   * Check if any blocking rules are triggered
   */
  static hasBlockingRules(evaluations: RuleEvaluation[]): boolean {
    return evaluations.some(
      (e) =>
        e.triggered && (["HARD_STOP", "NO_GO", "BLOCK_SUBMISSION"].includes(e.ruleType))
    );
  }

  /**
   * Calculate total penalty from malus rules
   */
  static calculateTotalPenalty(evaluations: RuleEvaluation[]): number {
    return evaluations
      .filter((e) => e.triggered && e.ruleType === "MALUS")
      .reduce((sum, e) => sum + (e.penalty || 0), 0);
  }

  /**
   * Get all user-facing messages from triggered rules
   */
  static getUserMessages(evaluations: RuleEvaluation[]): string[] {
    return evaluations
      .filter((e) => e.triggered && e.messageUser)
      .map((e) => e.messageUser!);
  }

  /**
   * Get all committee-facing messages from triggered rules
   */
  static getCommitteeMessages(evaluations: RuleEvaluation[]): string[] {
    return evaluations
      .filter((e) => e.triggered && e.messageCommittee)
      .map((e) => e.messageCommittee!);
  }

  /**
   * Get warnings (non-blocking issues)
   */
  static getWarnings(evaluations: RuleEvaluation[]): RuleEvaluation[] {
    return evaluations.filter(
      (e) =>
        e.triggered &&
        !e.blocking &&
        (e.ruleType === "WARNING" || e.ruleType === "REQUIRE_REVIEW")
    );
  }

  /**
   * Determine if evaluation can be published based on rules
   */
  static canPublish(evaluations: RuleEvaluation[]): boolean {
    const blockers = evaluations.filter(
      (e) => e.triggered && e.ruleType === "BLOCK_PUBLICATION"
    );
    return blockers.length === 0;
  }
}

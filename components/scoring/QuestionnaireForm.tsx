"use client";

import { useState, useEffect, type ReactElement } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { QuestionnaireNode } from "@/lib/services/scoring-questionnaire-service";

interface QuestionnaireFormProps {
  nodes: QuestionnaireNode[];
  onAnswersChange: (answers: Record<string, any>) => void;
  initialAnswers?: Record<string, any>;
}

const EMPTY_INITIAL_ANSWERS: Record<string, any> = {};

interface AnswerState {
  [nodeId: string]: {
    valueString?: string;
    valueNumber?: number;
    valueBoolean?: boolean;
    comment?: string;
  };
}

const DEFAULT_QUALITATIVE_OPTIONS = [
  { value: "TRES_FAIBLE", label: "Très faible", score: 10 },
  { value: "FAIBLE", label: "Faible", score: 35 },
  { value: "MOYEN", label: "Moyen", score: 60 },
  { value: "BON", label: "Bon", score: 80 },
  { value: "EXCELLENT", label: "Excellent", score: 95 },
];

export function QuestionnaireForm({
  nodes,
  onAnswersChange,
  initialAnswers = EMPTY_INITIAL_ANSWERS,
}: QuestionnaireFormProps) {
  const [answers, setAnswers] = useState<AnswerState>(initialAnswers);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedRootId, setSelectedRootId] = useState<string>("");

  useEffect(() => {
    setAnswers(initialAnswers);
  }, [initialAnswers]);

  useEffect(() => {
    onAnswersChange(answers);
  }, [answers, onAnswersChange]);

  useEffect(() => {
    if (nodes.length === 0) {
      setSelectedRootId("");
      setExpandedNodes(new Set());
      return;
    }

    setSelectedRootId((prev) => prev || nodes[0].id);

    const allNodeIds = new Set<string>();
    const collectNodeIds = (node: QuestionnaireNode) => {
      allNodeIds.add(node.id);
      node.children?.forEach(collectNodeIds);
    };
    nodes.forEach(collectNodeIds);
    setExpandedNodes(allNodeIds);
  }, [nodes]);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const updateAnswer = (
    nodeId: string,
    key: keyof Omit<AnswerState[string], "comment">,
    value: any
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        [key]: value,
      },
    }));
  };

  const updateComment = (nodeId: string, comment: string) => {
    setAnswers((prev) => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        comment,
      },
    }));
  };

  const collectLeafNodes = (node: QuestionnaireNode): QuestionnaireNode[] => {
    if (!node.children || node.children.length === 0) return [node];
    return node.children.flatMap(collectLeafNodes);
  };

  const isLeafAnswered = (node: QuestionnaireNode): boolean => {
    const answer = answers[node.id];
    if (!answer) return false;

    if (node.options && node.options.length > 0) {
      return Boolean(answer.valueString);
    }
    if (node.ranges && node.ranges.length > 0) {
      return typeof answer.valueNumber === "number";
    }
    if (node.answerType === "BOOLEAN") {
      return typeof answer.valueBoolean === "boolean";
    }
    if (node.answerType === "NUMERIC" || node.answerType === "NUMERIC_RANGE") {
      return typeof answer.valueNumber === "number";
    }
    return Boolean(answer.valueString && answer.valueString.trim().length > 0);
  };

  const getPaddingClass = (depth: number) => {
    const paddings = ["pl-0", "pl-4", "pl-8", "pl-12", "pl-16"];
    return paddings[Math.min(depth, paddings.length - 1)];
  };

  const getBgClass = (depth: number) => {
    if (depth === 0) return "bg-slate-800 font-semibold";
    if (depth === 1) return "bg-slate-700/50";
    return "bg-slate-800/30";
  };

  const renderNode = (
    node: QuestionnaireNode,
    depth: number = 0
  ): ReactElement => {
    const isParent = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const nodeAnswer = answers[node.id];
    const paddingClass = getPaddingClass(depth);
    const bgClass = getBgClass(depth);

    return (
      <div key={node.id} className="border-l border-slate-700">
        <div className={`${paddingClass} py-3 px-4 ${bgClass}`}>
          {/* Header with toggle */}
          <div className="flex items-center gap-2 mb-2">
            {isParent && (
              <button
                onClick={() => toggleNode(node.id)}
                className="p-1 hover:bg-slate-600 rounded"
              >
                {isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            )}
            <div className="flex-1">
              <h3 className="text-white font-medium">{node.label}</h3>
              {node.description && (
                <p className="text-xs text-slate-400 mt-1">
                  {node.description}
                </p>
              )}
            </div>
          </div>

          {/* Answer inputs */}
          {!isParent && (
            <div className="ml-6 space-y-3">
              {/* Options dropdown */}
              {node.options && node.options.length > 0 && (
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Choisir une option
                  </label>
                  <select
                    value={nodeAnswer?.valueString || ""}
                    onChange={(e) =>
                      updateAnswer(node.id, "valueString", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Sélectionner --</option>
                    {node.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} ({opt.score} pts)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Numeric range input */}
              {node.ranges && node.ranges.length > 0 && (
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Saisir une valeur
                  </label>
                  <input
                    type="number"
                    value={nodeAnswer?.valueNumber || ""}
                    onChange={(e) =>
                      updateAnswer(
                        node.id,
                        "valueNumber",
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    placeholder="Ex: 7.5"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Plages:{" "}
                    {node.ranges
                      .map((r) => `${r.minValue}-${r.maxValue}=${r.score}pts`)
                      .join(", ")}
                  </p>
                </div>
              )}

              {/* Generic answer input fallback by answerType */}
              {!node.options?.length && !node.ranges?.length && (
                <div>
                  {node.answerType === "BOOLEAN" ? (
                    <>
                      <label className="block text-sm text-slate-300 mb-2">
                        Réponse
                      </label>
                      <select
                        value={
                          typeof nodeAnswer?.valueBoolean === "boolean"
                            ? String(nodeAnswer.valueBoolean)
                            : ""
                        }
                        onChange={(e) =>
                          updateAnswer(
                            node.id,
                            "valueBoolean",
                            e.target.value === ""
                              ? undefined
                              : e.target.value === "true"
                          )
                        }
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Sélectionner --</option>
                        <option value="true">Oui</option>
                        <option value="false">Non</option>
                      </select>
                    </>
                  ) : node.answerType === "NUMERIC" ||
                    node.answerType === "NUMERIC_RANGE" ? (
                    <>
                      <label className="block text-sm text-slate-300 mb-2">
                        Saisir une valeur
                      </label>
                      <input
                        type="number"
                        value={nodeAnswer?.valueNumber ?? ""}
                        onChange={(e) =>
                          updateAnswer(
                            node.id,
                            "valueNumber",
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                      />
                    </>
                  ) : node.answerType === "OPTION_SINGLE" ||
                    node.answerType === "OPTION_MULTIPLE" ||
                    node.answerType === "VALUE_LIST" ||
                    node.answerType === "SELECT" ||
                    !node.answerType ? (
                    <>
                      <label className="block text-sm text-slate-300 mb-2">
                        Choisir une option
                      </label>
                      <select
                        value={nodeAnswer?.valueString || ""}
                        onChange={(e) =>
                          updateAnswer(node.id, "valueString", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Sélectionner --</option>
                        {DEFAULT_QUALITATIVE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label} ({opt.score} pts)
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <label className="block text-sm text-slate-300 mb-2">
                        Réponse
                      </label>
                      <input
                        type="text"
                        value={nodeAnswer?.valueString || ""}
                        onChange={(e) =>
                          updateAnswer(node.id, "valueString", e.target.value)
                        }
                        placeholder="Saisir une réponse..."
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                      />
                    </>
                  )}
                </div>
              )}

              {/* Comment */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Commentaire (optionnel)
                </label>
                <textarea
                  value={nodeAnswer?.comment || ""}
                  onChange={(e) => updateComment(node.id, e.target.value)}
                  placeholder="Notes ou justification..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        {/* Children */}
        {isParent && isExpanded && (
          <div>
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const selectedRootNode =
    nodes.find((node) => node.id === selectedRootId) || nodes[0];
  const selectedRootIndex = nodes.findIndex(
    (node) => node.id === selectedRootNode?.id
  );
  const selectedRootLeafNodes = selectedRootNode
    ? collectLeafNodes(selectedRootNode)
    : [];
  const selectedAnsweredCount =
    selectedRootLeafNodes.filter(isLeafAnswered).length;
  const selectedTotalCount = selectedRootLeafNodes.length;
  const selectedProgress =
    selectedTotalCount > 0
      ? Math.round((selectedAnsweredCount / selectedTotalCount) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-3">
      <aside className="rounded-lg border border-slate-700 bg-slate-900/40 p-2 h-fit lg:sticky lg:top-3">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">
          Domaines d&apos;évaluation
        </h3>
        <div className="space-y-2">
          {nodes.map((node) =>
            (() => {
              const nodeLeaves = collectLeafNodes(node);
              const answered = nodeLeaves.filter(isLeafAnswered).length;
              const remaining = nodeLeaves.length - answered;

              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedRootId(node.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    node.id === selectedRootId
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{node.label}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        remaining === 0
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {remaining} restant{remaining > 1 ? "s" : ""}
                    </span>
                  </div>
                </button>
              );
            })()
          )}
        </div>
      </aside>

      <section className="space-y-1">
        {selectedRootNode && (
          <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-300 font-medium">
                Progression — {selectedRootNode.label}
              </span>
              <span className="text-slate-400">
                {selectedAnsweredCount}/{selectedTotalCount} ({selectedProgress}
                %)
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all"
                style={{ width: `${selectedProgress}%` }}
              />
            </div>
          </div>
        )}

        {selectedRootNode ? renderNode(selectedRootNode) : null}

        {selectedRootNode && (
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() =>
                setSelectedRootId(
                  nodes[Math.max(0, selectedRootIndex - 1)]?.id ||
                    selectedRootId
                )
              }
              disabled={selectedRootIndex <= 0}
              className="px-4 py-2 rounded-md bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
            >
              ← Domaine précédent
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedRootId(
                  nodes[Math.min(nodes.length - 1, selectedRootIndex + 1)]
                    ?.id || selectedRootId
                )
              }
              disabled={selectedRootIndex >= nodes.length - 1}
              className="px-4 py-2 rounded-md bg-cyan-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-500"
            >
              Domaine suivant →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

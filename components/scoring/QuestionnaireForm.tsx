"use client";

import { useState, useEffect, type ReactElement } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { QuestionnaireNode } from "@/lib/services/scoring-questionnaire-service";

interface QuestionnaireFormProps {
  nodes: QuestionnaireNode[];
  onAnswersChange: (answers: Record<string, any>) => void;
  initialAnswers?: Record<string, any>;
}

interface AnswerState {
  [nodeId: string]: {
    valueString?: string;
    valueNumber?: number;
    valueBoolean?: boolean;
    comment?: string;
  };
}

export function QuestionnaireForm({
  nodes,
  onAnswersChange,
  initialAnswers = {},
}: QuestionnaireFormProps) {
  const [answers, setAnswers] = useState<AnswerState>(initialAnswers);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedRootId, setSelectedRootId] = useState<string>("");

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
    key: keyof Omit<
      AnswerState[string],
      "comment"
    >,
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

  const getPaddingClass = (depth: number) => {
    const paddings = ["pl-0", "pl-4", "pl-8", "pl-12", "pl-16"];
    return paddings[Math.min(depth, paddings.length - 1)];
  };

  const getBgClass = (depth: number) => {
    if (depth === 0) return "bg-slate-800 font-semibold";
    if (depth === 1) return "bg-slate-700/50";
    return "bg-slate-800/30";
  };

  const renderNode = (node: QuestionnaireNode, depth: number = 0): ReactElement => {
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
                <p className="text-xs text-slate-400 mt-1">{node.description}</p>
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
                      updateAnswer(node.id, "valueNumber", e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    placeholder="Ex: 7.5"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Plages: {node.ranges.map((r) => `${r.minValue}-${r.maxValue}=${r.score}pts`).join(", ")}
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
      <aside className="rounded-lg border border-slate-700 bg-slate-900/40 p-3 h-fit lg:sticky lg:top-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">
          Domaines d&apos;évaluation
        </h3>
        <div className="space-y-2">
          {nodes.map((node) => (
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
              {node.label}
            </button>
          ))}
        </div>
      </aside>

      <section className="space-y-2">
        {selectedRootNode ? renderNode(selectedRootNode) : null}
      </section>
    </div>
  );
}

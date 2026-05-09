"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
import { DeleteConfirmation } from "@/components/modals/DeleteConfirmation";
import { QuestionnaireForm } from "@/components/scoring/QuestionnaireForm";
import type { QuestionnaireNode } from "@/lib/services/scoring-questionnaire-service";

interface StoredAnswer {
  nodeId: string;
  valueString?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  comment?: string | null;
}

interface Evaluation {
  id: string;
  projectId: string;
  modelVersionId: string;
  project?: { nom: string };
  model?: { label: string; code: string };
  version?: { label?: string | null; versionNumber: number };
  rating?: string | null;
  finalScore?: number | null;
  recommendation?: string | null;
  notes?: string | null;
  status: string;
  answers?: StoredAnswer[];
  updatedAt?: string;
}

interface QuestionnaireResponse {
  data?: QuestionnaireNode[];
  error?: string;
}

const EDITABLE_STATUSES = new Set(["brouillon", "retour_correction"]);

const toAnswerMap = (answers: StoredAnswer[] = []) =>
  answers.reduce<Record<string, unknown>>((acc, answer) => {
    acc[answer.nodeId] = {
      valueString: answer.valueString ?? undefined,
      valueNumber: answer.valueNumber ?? undefined,
      valueBoolean: answer.valueBoolean ?? undefined,
      comment: answer.comment ?? undefined,
    };
    return acc;
  }, {});

const toAnswerArray = (answers: Record<string, unknown>) =>
  Object.entries(answers)
    .map(([nodeId, value]) => {
      const answerValue =
        value && typeof value === "object"
          ? (value as {
              valueString?: string;
              valueNumber?: number;
              valueBoolean?: boolean;
              comment?: string;
            })
          : undefined;

      return {
        nodeId,
        valueString:
          answerValue && typeof answerValue.valueString === "string"
            ? answerValue.valueString
            : undefined,
        valueNumber:
          answerValue && typeof answerValue.valueNumber === "number"
            ? answerValue.valueNumber
            : undefined,
        valueBoolean:
          answerValue && typeof answerValue.valueBoolean === "boolean"
            ? answerValue.valueBoolean
            : undefined,
        comment:
          answerValue && typeof answerValue.comment === "string"
            ? answerValue.comment
            : undefined,
      };
    })
    .filter(
      (answer) =>
        answer.valueString !== undefined ||
        answer.valueNumber !== undefined ||
        answer.valueBoolean !== undefined ||
        answer.comment !== undefined
    );

export default function EditEvaluationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [evalId, setEvalId] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireNode[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [initialAnswers, setInitialAnswers] = useState<Record<string, unknown>>(
    {}
  );
  const [notes, setNotes] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [status, setStatus] = useState("brouillon");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvaluationAndQuestionnaire = async () => {
      try {
        setLoading(true);
        setError(null);

        const { id } = await params;
        setEvalId(id);

        const evaluationResponse = await fetch(`/api/evaluations/${id}`);
        const evaluationPayload = await evaluationResponse.json();

        if (!evaluationResponse.ok) {
          throw new Error(
            evaluationPayload.error ||
              "Erreur lors du chargement de l'évaluation"
          );
        }

        const loadedEvaluation = (evaluationPayload.data ||
          evaluationPayload) as Evaluation;
        setEvaluation(loadedEvaluation);
        setStatus(loadedEvaluation.status || "brouillon");
        setNotes(loadedEvaluation.notes || "");
        setRecommendation(loadedEvaluation.recommendation || "");

        const loadedAnswers = toAnswerMap(loadedEvaluation.answers || []);
        setInitialAnswers(loadedAnswers);
        setAnswers(loadedAnswers);

        const questionnaireResponse = await fetch(
          `/api/scoring/questionnaire?modelVersionId=${encodeURIComponent(
            loadedEvaluation.modelVersionId
          )}`
        );
        const questionnairePayload =
          (await questionnaireResponse.json()) as QuestionnaireResponse;

        if (!questionnaireResponse.ok) {
          throw new Error(
            questionnairePayload.error ||
              "Erreur lors du chargement du questionnaire"
          );
        }

        setQuestionnaire(questionnairePayload.data || []);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement de l'évaluation"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluationAndQuestionnaire();
  }, [params]);

  const handleAnswersChange = useCallback(
    (nextAnswers: Record<string, unknown>) => {
      setAnswers(nextAnswers);
    },
    []
  );

  const isArchived = status === "archive";
  const canEditAnswers = EDITABLE_STATUSES.has(evaluation?.status || status);

  const handleSave = async () => {
    if (!evalId) return;

    try {
      setSubmitting(true);
      setError(null);

      if (canEditAnswers) {
        const scoreResponse = await fetch("/api/evaluations/calculate-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            evaluationId: evalId,
            answers: toAnswerArray(answers),
          }),
        });
        const scorePayload = await scoreResponse.json();

        if (!scoreResponse.ok) {
          throw new Error(
            scorePayload.error || "Erreur lors du recalcul du score"
          );
        }
      }

      const metadataResponse = await fetch(`/api/evaluations/${evalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, recommendation, notes }),
      });
      const metadataPayload = await metadataResponse.json();

      if (!metadataResponse.ok) {
        throw new Error(
          metadataPayload.error ||
            "Erreur lors de la sauvegarde des métadonnées"
        );
      }

      router.push(`/evaluations/${evalId}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la sauvegarde"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!evalId) return;

    try {
      setDeleting(true);
      setError(null);

      const response = await fetch(`/api/evaluations/${evalId}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Erreur lors de la suppression");
      }

      router.push("/evaluations");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDelete = async () => {
    if (!evalId) return;

    try {
      setDeleting(true);
      setError(null);

      const response = await fetch(`/api/evaluations/${evalId}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Erreur lors de la suppression");
      }

      router.push("/evaluations");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-400" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href={evalId ? `/evaluations/${evalId}` : "/evaluations"}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            title="Retour"
          >
            <ArrowLeft size={20} className="text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Modifier l&apos;évaluation scoring
            </h1>
            <p className="text-slate-400 mt-2">
              {evaluation?.project?.nom || "Projet"} ·{" "}
              {evaluation?.model?.label || "Modèle"}
              {evaluation?.version
                ? ` · ${evaluation.version.label || `v${evaluation.version.versionNumber}`}`
                : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:opacity-50"
          >
            <Trash2 size={18} />
            Supprimer
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting || isArchived}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Enregistrer et recalculer
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {isArchived && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 text-amber-300 text-sm">
          Cette évaluation est archivée. Restaurez-la depuis la liste pour
          modifier le scoring.
        </div>
      )}

      <section className="grid gap-4 rounded-lg border border-slate-700 bg-slate-800 p-4 lg:grid-cols-4">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Statut
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="brouillon">Brouillon</option>
            <option value="soumis">Soumis</option>
            <option value="en_revue">En revue</option>
            <option value="retour_correction">Retour correction</option>
            <option value="valide">Validé</option>
            <option value="rejete">Rejeté</option>
            <option value="archive">Archivé</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Recommandation
          </label>
          <select
            value={recommendation}
            onChange={(event) => setRecommendation(event.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="">À recalculer</option>
            <option value="APPROVE">Approuver</option>
            <option value="APPROVE_WITH_CONDITIONS">
              Approuver avec conditions
            </option>
            <option value="REJECT">Rejeter</option>
          </select>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Score
          </p>
          <p className="text-2xl font-bold text-cyan-300">
            {evaluation?.finalScore != null
              ? evaluation.finalScore.toFixed(2)
              : "—"}
          </p>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Rating
          </p>
          <p className="text-2xl font-bold text-white">
            {evaluation?.rating || "—"}
          </p>
        </div>

        <div className="lg:col-span-4">
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Notes de synthèse
          </label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            placeholder="Commentaires, justification de décision, réserves..."
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800 p-4">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Questionnaire dynamique
            </h2>
            <p className="text-sm text-slate-400">
              Les réponses existantes sont préchargées; l&apos;enregistrement
              synchronise les réponses, les résultats détaillés et le score
              global.
            </p>
          </div>
          {!canEditAnswers && !isArchived && (
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
              Réponses verrouillées pour ce statut
            </span>
          )}
        </div>

        {questionnaire.length > 0 ? (
          <div
            className={
              canEditAnswers && !isArchived
                ? ""
                : "pointer-events-none opacity-70"
            }
          >
            <QuestionnaireForm
              nodes={questionnaire}
              initialAnswers={initialAnswers}
              onAnswersChange={handleAnswersChange}
            />
          </div>
        ) : (
          <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-6 text-center text-slate-400">
            Aucun questionnaire disponible pour la version de modèle de cette
            évaluation.
          </div>
        )}
      </section>

      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isDeleting={deleting}
        title="Supprimer l'évaluation"
        message="Voulez-vous supprimer définitivement cette évaluation, ses réponses et ses résultats calculés ? Cette action est irréversible."
      />
    </div>
  );
}

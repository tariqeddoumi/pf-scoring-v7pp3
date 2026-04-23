"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { QuestionnaireForm } from "@/components/scoring/QuestionnaireForm";
import type { QuestionnaireNode } from "@/lib/services/scoring-questionnaire-service";

interface Project {
  id: string;
  nom: string;
}

interface ScoringModel {
  id: string;
  label: string;
  code: string;
}

interface ScoringVersion {
  id: string;
  versionNumber: number;
  label: string;
  status: string;
  isPublished: boolean;
  modelId: string;
}

interface EvaluationCreateResponse {
  data?: { id?: string };
  error?: string;
}

interface QuestionnaireResponse {
  data?: QuestionnaireNode[];
  modelVersionId?: string;
  error?: string;
}

export default function NewEvaluationPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [models, setModels] = useState<ScoringModel[]>([]);
  const [versions, setVersions] = useState<ScoringVersion[]>([]);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireNode[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState("");

  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});

  const [loadingInitialData, setLoadingInitialData] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [loadingQuestionnaire, setLoadingQuestionnaire] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasPublishedVersions, setHasPublishedVersions] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingInitialData(true);
        setError("");

        const [projectsRes, modelsRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/admin/scoring/models"),
        ]);

        if (!projectsRes.ok) {
          throw new Error("Erreur lors du chargement des projets");
        }

        if (!modelsRes.ok) {
          throw new Error("Erreur lors du chargement des modèles de scoring");
        }

        const projectsData = await projectsRes.json();
        const modelsData = await modelsRes.json();

        const modelsList: ScoringModel[] = modelsData.data || [];

        setProjects(projectsData.data || []);
        setModels(modelsList);

        if (modelsList.length === 0) {
          setHasPublishedVersions(false);
          return;
        }

        const versionsPayloads = await Promise.all(
          modelsList.map(async (model) => {
            const res = await fetch(`/api/admin/scoring/models/${model.id}/versions`);
            if (!res.ok) return [] as ScoringVersion[];
            const payload = await res.json();
            return (payload.data || []) as ScoringVersion[];
          })
        );

        const hasPublished = versionsPayloads.some((modelVersions) =>
          modelVersions.some(
            (version) => version.isPublished || version.status === "PUBLISHED"
          )
        );
        setHasPublishedVersions(hasPublished);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Erreur lors du chargement des données";
        setError(message);
      } finally {
        setLoadingInitialData(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchVersions = async () => {
      if (!selectedModelId) {
        setVersions([]);
        setSelectedVersionId("");
        setQuestionnaire([]);
        return;
      }

      try {
        setLoadingVersions(true);
        setError("");
        setSelectedVersionId("");
        setQuestionnaire([]);

        const res = await fetch(`/api/admin/scoring/models/${selectedModelId}/versions`);

        if (!res.ok) {
          throw new Error("Erreur lors du chargement des versions");
        }

        const payload = await res.json();
        const allVersions: ScoringVersion[] = payload.data || [];

        const publishedVersions = allVersions.filter(
          (version) => version.isPublished || version.status === "PUBLISHED"
        );

        setVersions(publishedVersions);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Erreur lors du chargement des versions";
        setError(message);
      } finally {
        setLoadingVersions(false);
      }
    };

    fetchVersions();
  }, [selectedModelId]);

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      if (!selectedVersionId) {
        setQuestionnaire([]);
        return;
      }

      try {
        setLoadingQuestionnaire(true);
        setError("");

        const res = await fetch(
          `/api/scoring/questionnaire?modelVersionId=${encodeURIComponent(selectedVersionId)}`
        );

        if (!res.ok) {
          const payload = (await res.json()) as QuestionnaireResponse;
          throw new Error(payload.error || "Erreur lors du chargement du questionnaire");
        }

        const payload = (await res.json()) as QuestionnaireResponse;
        setQuestionnaire(payload.data || []);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement du questionnaire";
        setError(message);
      } finally {
        setLoadingQuestionnaire(false);
      }
    };

    fetchQuestionnaire();
  }, [selectedVersionId]);

  const selectedVersion = useMemo(
    () => versions.find((version) => version.id === selectedVersionId),
    [versions, selectedVersionId]
  );

  const canCreateEvaluation =
    selectedProjectId.length > 0 && selectedModelId.length > 0 && selectedVersionId.length > 0;

  const handleCreateEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canCreateEvaluation) return;

    try {
      setSubmitting(true);
      setError("");

      const res = await fetch("/api/admin/scoring/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          modelId: selectedModelId,
          modelVersionId: selectedVersionId,
        }),
      });

      const payload = (await res.json()) as EvaluationCreateResponse;

      if (!res.ok) {
        throw new Error(payload.error || "Erreur lors de la création de l'évaluation");
      }

      const createdId = payload.data?.id;

      if (!createdId) {
        throw new Error("Évaluation créée mais identifiant introuvable dans la réponse API.");
      }

      setEvaluationId(createdId);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de la création de l'évaluation";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAnswers = async () => {
    if (!evaluationId || !selectedVersionId) return;

    try {
      setSubmitting(true);
      setError("");

      const answersArray = Object.entries(answers).map(([nodeId, value]) => {
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
          answerType: "VALUE",
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
      });

      const res = await fetch("/api/evaluations/calculate-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluationId,
          modelVersionId: selectedVersionId,
          answers: answersArray,
        }),
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error || "Erreur lors du calcul du score");
      }

      router.push(`/evaluations/${evaluationId}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erreur lors du calcul du score";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitialData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-400" size={40} />
      </div>
    );
  }

  if (!evaluationId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/evaluations"
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            title="Retour"
          >
            <ArrowLeft size={20} className="text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Nouvelle Évaluation</h1>
            <p className="text-slate-400 mt-2">
              Sélectionnez le projet et la version publiée du modèle de scoring
            </p>
          </div>
        </div>

        <div className="max-w-2xl rounded-lg border border-slate-700 bg-slate-800 p-6">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          {projects.length === 0 && !error && (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4 text-yellow-400 text-sm mb-6">
              Aucun projet trouvé. Créez un projet d&apos;abord.
            </div>
          )}
          {!hasPublishedVersions && !error && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 text-amber-300 text-sm mb-6">
              Aucun modèle de scoring disponible. Publiez une version depuis l&apos;administration
              de scoring pour activer la saisie d&apos;évaluation.
            </div>
          )}

          <form onSubmit={handleCreateEvaluation} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Projet *
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                required
                disabled={projects.length === 0}
              >
                <option value="">-- Choisir un projet --</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Modèle de scoring *
              </label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                required
                disabled={models.length === 0}
              >
                <option value="">-- Choisir un modèle --</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label} ({model.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Version publiée *
              </label>
              <select
                value={selectedVersionId}
                onChange={(e) => setSelectedVersionId(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                required
                disabled={!selectedModelId || loadingVersions || versions.length === 0}
              >
                <option value="">
                  {loadingVersions
                    ? "Chargement des versions..."
                    : "-- Choisir une version publiée --"}
                </option>
                {versions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.label || `v${version.versionNumber}`}
                  </option>
                ))}
              </select>
              {selectedModelId && !loadingVersions && versions.length === 0 && (
                <p className="mt-2 text-xs text-amber-400">
                  Aucune version publiée disponible pour ce modèle.
                </p>
              )}
            </div>

            <div className="rounded-md border border-slate-700 bg-slate-900/40 p-3 text-xs text-slate-400">
              {selectedVersion
                ? `Version sélectionnée: ${selectedVersion.label || `v${selectedVersion.versionNumber}`}`
                : "Sélectionnez une version publiée pour charger le questionnaire."}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting || !canCreateEvaluation}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  "Créer et continuer"
                )}
              </button>
              <Link
                href="/evaluations"
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all"
              >
                Annuler
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/evaluations"
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          title="Retour"
        >
          <ArrowLeft size={20} className="text-slate-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Compléter l&apos;Évaluation</h1>
          <p className="text-slate-400 mt-2">Répondez aux questions de scoring</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {loadingQuestionnaire ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin text-blue-400" size={26} />
          </div>
        ) : questionnaire.length > 0 ? (
          <>
            <QuestionnaireForm nodes={questionnaire} onAnswersChange={setAnswers} />

            <div className="flex gap-3 pt-6 mt-6 border-t border-slate-700">
              <button
                onClick={handleSubmitAnswers}
                disabled={submitting}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Calcul en cours...
                  </>
                ) : (
                  "Calculer le score et finir"
                )}
              </button>
              <Link
                href="/evaluations"
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all"
              >
                Annuler
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400">Aucun questionnaire disponible pour cette version</p>
            <Link
              href="/evaluations"
              className="text-cyan-400 hover:text-cyan-300 mt-4 inline-block"
            >
              Retourner à la liste
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

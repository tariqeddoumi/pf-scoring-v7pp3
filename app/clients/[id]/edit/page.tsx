"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Loader2,
  Building2,
  MapPin,
  Briefcase,
  Shield,
  Users,
  BarChart3,
} from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import {
  ApiErrorPayload,
  CLIENT_FORM_OPTIONS,
  ClientFormData,
  getDefaultClientFormData,
} from "@/lib/client-form-config";

export default function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiErrorPayload | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [clientId, setClientId] = useState<string | null>(null);

  const [formData, setFormData] = useState<ClientFormData>(getDefaultClientFormData());

  // Resolve params and fetch data
  useEffect(() => {
    const resolveAndFetch = async () => {
      try {
        const { id } = await params;
        setClientId(id);

        // Fetch client data
        const clientResponse = await fetch(`/api/clients/${id}`);
        if (!clientResponse.ok) throw new Error("Failed to fetch client");
        const clientData = (await clientResponse.json()) as {
          data?: Partial<ClientFormData> & { dateRelation?: string | null };
        };
        const client = clientData.data || {};

        // Format dates
        if (client.dateRelation) {
          client.dateRelation = client.dateRelation.split('T')[0];
        }

        setFormData((prev) => ({
          ...prev,
          ...(client as Partial<ClientFormData>),
        }));
        setError(null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load client";
        setError({
          error: message,
          errorCode: "ERR_API_001",
        });
      } finally {
        setLoading(false);
      }
    };

    resolveAndFetch();
  }, [params]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      if (!clientId) throw new Error("Client ID not found");

      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = (await response.json()) as ApiErrorPayload;

      if (!response.ok) {
        setError({
          error: data.error || "Failed to update client",
          errorCode: data.errorCode,
          errors: Array.isArray(data.errors) ? data.errors : [],
          details: data.details,
          requestId: data.requestId,
          timestamp: data.timestamp,
          developerMessage: data.developerMessage,
        });
        if (data.errors && Array.isArray(data.errors)) {
          const errors: Record<string, string> = {};
          data.errors.forEach((err) => {
            errors[err.field] = err.message;
          });
          setFieldErrors(errors);
        }
        return;
      }

      router.push(`/clients/${clientId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update client";
      setError({
        error: message,
        errorCode: "ERR_NET_001",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-400" size={40} />
      </div>
    );
  }

  const tabs = [
    {
      id: "identity",
      label: "Identité & Admin",
      icon: <Building2 size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nom du client
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-slate-700 border ${
                  fieldErrors.nom ? "border-red-500" : "border-slate-600"
                } rounded-lg text-white focus:outline-none focus:border-blue-500`}
              />
              {fieldErrors.nom && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.nom}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Raison sociale
              </label>
              <input
                type="text"
                name="raisonSociale"
                value={formData.raisonSociale || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nom commercial
              </label>
              <input
                type="text"
                name="nomCommercial"
                value={formData.nomCommercial || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Type de client
              </label>
              <select
                name="typeClient"
                value={formData.typeClient || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Sélectionner</option>
                <option value="Entreprise">Entreprise</option>
                <option value="PME">PME</option>
                <option value="GE">Grande Entreprise</option>
                <option value="Etat">État/Institution</option>
                <option value="ONG">ONG</option>
                <option value="Particulier">Particulier</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Forme juridique
              </label>
              <select
                name="formeJuridique"
                value={formData.formeJuridique || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Sélectionner</option>
                <option value="SARL">SARL</option>
                <option value="SA">S.A.</option>
                <option value="EIRL">EIRL</option>
                <option value="SNC">SNC</option>
                <option value="SCS">SCS</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Statut
              </label>
              <select
                name="status"
                value={formData.status || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Actif">Actif</option>
                <option value="Inactif">Inactif</option>
                <option value="Suspendu">Suspendu</option>
              </select>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "organisation",
      label: "Organisation & Secteur",
      icon: <Briefcase size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Secteur
              </label>
              <select
                name="secteur"
                value={formData.secteur || ""}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-slate-700 border ${
                  fieldErrors.secteur ? "border-red-500" : "border-slate-600"
                } rounded-lg text-white focus:outline-none focus:border-blue-500`}
              >
                <option value="">Sélectionner</option>
                {CLIENT_FORM_OPTIONS.secteurs.map((secteur) => (
                  <option key={secteur} value={secteur}>
                    {secteur}
                  </option>
                ))}
              </select>
              {fieldErrors.secteur && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.secteur}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Segment clientèle
              </label>
              <select
                name="segmentClientele"
                value={formData.segmentClientele || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Sélectionner</option>
                <option value="Particulier">Particulier</option>
                <option value="PME">PME</option>
                <option value="Entreprise">Entreprise</option>
                <option value="Corporate">Corporate</option>
                <option value="Institutionnel">Institutionnel</option>
                <option value="Souverain">Souverain</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Effectifs
              </label>
              <input
                type="number"
                name="effectifs"
                value={formData.effectifs || ""}
                onChange={handleChange}
                min={0}
                className={`w-full px-4 py-2 bg-slate-700 border ${
                  fieldErrors.effectifs ? "border-red-500" : "border-slate-600"
                } rounded-lg text-white focus:outline-none focus:border-blue-500`}
              />
              {fieldErrors.effectifs && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.effectifs}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Capital social (MAD)
              </label>
              <input
                type="number"
                name="capitalSocial"
                value={formData.capitalSocial || ""}
                onChange={handleChange}
                min={0}
                className={`w-full px-4 py-2 bg-slate-700 border ${
                  fieldErrors.capitalSocial ? "border-red-500" : "border-slate-600"
                } rounded-lg text-white focus:outline-none focus:border-blue-500`}
              />
              {fieldErrors.capitalSocial && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.capitalSocial}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Chiffre d&apos;affaires (MAD)
              </label>
              <input
                type="number"
                name="chiffreAffaires"
                value={formData.chiffreAffaires || ""}
                onChange={handleChange}
                min={0}
                className={`w-full px-4 py-2 bg-slate-700 border ${
                  fieldErrors.chiffreAffaires ? "border-red-500" : "border-slate-600"
                } rounded-lg text-white focus:outline-none focus:border-blue-500`}
              />
              {fieldErrors.chiffreAffaires && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.chiffreAffaires}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description / Activités
            </label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      ),
    },
    {
      id: "localisation",
      label: "Localisation",
      icon: <MapPin size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Pays
              </label>
              <select
                name="pays"
                value={formData.pays || ""}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-slate-700 border ${
                  fieldErrors.pays ? "border-red-500" : "border-slate-600"
                } rounded-lg text-white focus:outline-none focus:border-blue-500`}
              >
                <option value="">Sélectionner</option>
                {CLIENT_FORM_OPTIONS.pays.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              {fieldErrors.pays && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.pays}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Ville
              </label>
              <input
                type="text"
                name="ville"
                value={formData.ville || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Code postal
              </label>
              <input
                type="text"
                name="codePostal"
                value={formData.codePostal || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Adresse
            </label>
            <textarea
              name="adresse"
              value={formData.adresse || ""}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      ),
    },
    {
      id: "contact",
      label: "Contact",
      icon: <Users size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-slate-700 border ${
                  fieldErrors.email ? "border-red-500" : "border-slate-600"
                } rounded-lg text-white focus:outline-none focus:border-blue-500`}
              />
              {fieldErrors.email && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone || ""}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-slate-700 border ${
                  fieldErrors.telephone ? "border-red-500" : "border-slate-600"
                } rounded-lg text-white focus:outline-none focus:border-blue-500`}
              />
              {fieldErrors.telephone && (
                <p className="text-red-400 text-sm mt-1">
                  {fieldErrors.telephone}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Site web
              </label>
              <input
                type="url"
                name="website"
                value={formData.website || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "banking",
      label: "Relations Bancaires",
      icon: <BarChart3 size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Centre d&apos;affaires
              </label>
              <input
                type="text"
                name="centreAffaires"
                value={formData.centreAffaires || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Gestionnaire
              </label>
              <input
                type="text"
                name="gestionnaire"
                value={formData.gestionnaire || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Rating interne
              </label>
              <select
                name="ratingInterne"
                value={formData.ratingInterne || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Sélectionner</option>
                <option value="AAA">AAA</option>
                <option value="AA">AA</option>
                <option value="A">A</option>
                <option value="BBB">BBB</option>
                <option value="BB">BB</option>
                <option value="B">B</option>
                <option value="CCC">CCC</option>
                <option value="D">D</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Statut bancaire
              </label>
              <select
                name="statutBancaire"
                value={formData.statutBancaire || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Prospect">Prospect</option>
                <option value="Client">Client</option>
                <option value="VIP">VIP</option>
                <option value="Inactif">Inactif</option>
                <option value="Suspendu">Suspendu</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Date du début de relation
              </label>
              <input
                type="date"
                name="dateRelation"
                value={formData.dateRelation || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Exposition (MAD)
              </label>
              <input
                type="number"
                name="exposition"
                value={formData.exposition || ""}
                onChange={handleChange}
                min={0}
                className={`w-full px-4 py-2 bg-slate-700 border ${
                  fieldErrors.exposition ? "border-red-500" : "border-slate-600"
                } rounded-lg text-white focus:outline-none focus:border-blue-500`}
              />
              {fieldErrors.exposition && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.exposition}</p>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "kyc",
      label: "KYC & Conformité",
      icon: <Shield size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Statut KYC
              </label>
              <select
                name="statusKYC"
                value={formData.statusKYC || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="En attente">En attente</option>
                <option value="Vérifiée">Vérifiée</option>
                <option value="Rejet">Rejet</option>
                <option value="Expiration">Expiration</option>
                <option value="À renouveler">À renouveler</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Statut conformité
              </label>
              <select
                name="statusConformite"
                value={formData.statusConformite || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="En attente">En attente</option>
                <option value="Conforme">Conforme</option>
                <option value="Non conforme">Non conforme</option>
                <option value="Alerte">Alerte</option>
                <option value="Exemption">Exemption</option>
              </select>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Modifier le client</h1>
          <p className="text-slate-400 mt-1">Mettez à jour les informations du client</p>
        </div>
        <Link
          href={`/clients/${clientId}`}
          className="inline-flex items-center space-x-2 text-slate-400 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Retour</span>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-300 text-sm space-y-2">
          <div className="font-semibold text-red-200">{error.error}</div>
          {error.errorCode && (
            <div className="text-xs text-red-300/90">
              Code erreur: <span className="font-mono">{error.errorCode}</span>
            </div>
          )}
          {error.details && <div className="text-xs text-red-300/90">{error.details}</div>}
          {error.errors && error.errors.length > 0 && (
            <ul className="list-disc list-inside text-xs space-y-1">
              {error.errors.map((err, idx) => (
                <li key={`${err.field}-${idx}`}>
                  <span className="font-medium">{err.field}</span>: {err.message}
                  {err.code ? ` (${err.code})` : ""}
                </li>
              ))}
            </ul>
          )}
          {(error.requestId || error.timestamp || error.developerMessage) && (
            <details className="text-xs text-red-200/80">
              <summary className="cursor-pointer">Détails techniques (support/dev)</summary>
              <div className="mt-2 space-y-1 font-mono">
                {error.requestId && <div>requestId: {error.requestId}</div>}
                {error.timestamp && <div>timestamp: {error.timestamp}</div>}
                {error.developerMessage && <div>debug: {error.developerMessage}</div>}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <Tabs tabs={tabs} defaultTab="identity" />

        {/* Form Actions */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-slate-700">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Mise à jour...</span>
              </>
            ) : (
              <span>Enregistrer les modifications</span>
            )}
          </button>
          <Link
            href={`/clients/${clientId}`}
            className="inline-flex items-center gap-2 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}

export type ApiFieldError = {
  field: string;
  message: string;
  code?: string;
};

export type ApiErrorPayload = {
  error?: string;
  errorCode?: string;
  details?: string;
  requestId?: string;
  timestamp?: string;
  developerMessage?: string;
  errors?: ApiFieldError[];
};

export type ClientFormData = {
  nom: string;
  raisonSociale: string;
  nomCommercial: string;
  typeClient: string;
  formeJuridique: string;
  secteur: string;
  segmentClientele: string;
  effectifs: string;
  capitalSocial: string;
  chiffreAffaires: string;
  pays: string;
  ville: string;
  adresse: string;
  codePostal: string;
  email: string;
  telephone: string;
  website: string;
  centreAffaires: string;
  gestionnaire: string;
  ratingInterne: string;
  statutBancaire: string;
  dateRelation: string;
  exposition: string;
  statusKYC: string;
  statusConformite: string;
  description: string;
  status: string;
};

export const getDefaultClientFormData = (): ClientFormData => ({
  nom: "",
  raisonSociale: "",
  nomCommercial: "",
  typeClient: "Entreprise",
  formeJuridique: "",
  secteur: "",
  segmentClientele: "",
  effectifs: "",
  capitalSocial: "",
  chiffreAffaires: "",
  pays: "Maroc",
  ville: "",
  adresse: "",
  codePostal: "",
  email: "",
  telephone: "",
  website: "",
  centreAffaires: "",
  gestionnaire: "",
  ratingInterne: "",
  statutBancaire: "Prospect",
  dateRelation: "",
  exposition: "",
  statusKYC: "En attente",
  statusConformite: "En attente",
  description: "",
  status: "Actif",
});

/**
 * Options métier standardisées pour les formulaires client.
 * Centraliser ici évite les divergences entre écran de création et d'édition.
 */
export const CLIENT_FORM_OPTIONS = {
  secteurs: [
    "Agriculture",
    "Agroalimentaire",
    "Automobile",
    "BTP",
    "Commerce",
    "Énergie",
    "Industrie",
    "Immobilier",
    "Infrastructures",
    "Mines",
    "Santé",
    "Services",
    "Télécom",
    "Tourisme",
    "Transport",
  ],
  pays: [
    "Maroc",
    "France",
    "Espagne",
    "Émirats arabes unis",
    "Sénégal",
    "Côte d’Ivoire",
  ],
};

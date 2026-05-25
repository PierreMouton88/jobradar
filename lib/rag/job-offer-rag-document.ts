type JobOfferRagInput = {
  title: string;
  company: string;
  location: string;
  contractType: string;
  remote: boolean;
  skills: string[];
  description: string;
  analysis?: {
    summary: string;
    requiredSkills: string[];
    niceToHaveSkills: string[];
    experienceLevel: string;
    remotePolicy: string;
    redFlags: string[];
    positiveSignals: string[];
  } | null;
};

function formatList(items: string[], fallback = "Non renseigné"): string {
  return items.length > 0 ? items.join(", ") : fallback;
}

export function buildJobOfferRagDocument(offer: JobOfferRagInput): string {
  return `Titre : ${offer.title}
Entreprise : ${offer.company}
Lieu : ${offer.location}
Type de contrat : ${offer.contractType}
Remote : ${offer.remote ? "Oui" : "Non"}
Compétences détectées : ${formatList(offer.skills)}

Résumé de l'analyse précédente :
${offer.analysis ? offer.analysis.summary : "Aucune analyse précédente"}

Compétences requises :
${offer.analysis ? formatList(offer.analysis.requiredSkills) : "Non renseigné"}

Compétences appréciées :
${offer.analysis ? formatList(offer.analysis.niceToHaveSkills) : "Non renseigné"}

Niveau d'expérience :
${offer.analysis ? offer.analysis.experienceLevel : "Non renseigné"}

Politique de télétravail :
${offer.analysis ? offer.analysis.remotePolicy : "Non renseigné"}

Signaux positifs :
${offer.analysis ? formatList(offer.analysis.positiveSignals) : "Non renseigné"}

Points de vigilance :
${offer.analysis ? formatList(offer.analysis.redFlags) : "Non renseigné"}

Description :
${offer.description}
`;
}



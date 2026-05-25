import { buildJobOfferRagDocument } from "@/lib/rag/job-offer-rag-document";

const fakeOffer = {
  title: "Développeur Fullstack JavaScript",
  company: "FastScale Agency",
  location: "Paris",
  contractType: "CDI",
  remote: false,
  skills: ["React", "Node.js", "PostgreSQL", "Docker"],
  description:
    "Nous recherchons un développeur fullstack JavaScript capable de travailler sur des projets clients variés avec React, Node.js et PostgreSQL.",

  analysis: {
    summary:
      "Offre orientée fullstack JavaScript, avec un environnement projet client et une forte attente d'autonomie.",
    requiredSkills: ["React", "Node.js", "PostgreSQL"],
    niceToHaveSkills: ["Docker", "CI/CD"],
    experienceLevel: "mid",
    remotePolicy: "on_site",
    redFlags: ["Présentiel majoritaire", "Délais courts"],
    positiveSignals: ["Stack cohérente", "Projets variés"],
  },
};

const ragDocument = buildJobOfferRagDocument(fakeOffer);

console.log("=== DOCUMENT RAG ===");
console.log(ragDocument);
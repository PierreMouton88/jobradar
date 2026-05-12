import { JobOffer } from "../types/job-offer";


export const mockOffers: JobOffer[] = [
  {
    id: "1",
    title: "Développeur Frontend React Junior",
    company: "TechNova",
    location: "Strasbourg",
    contractType: "CDI",
    remote: "partial",
    skills: ["React", "TypeScript", "CSS"],
    description:
      "TechNova recherche un développeur frontend junior pour participer au développement d'une application SaaS en React et TypeScript.",
    source: "MockSource",
    url: "https://example.com/jobs/1",
    createdAt: "2026-05-12",
  },
  {
    id: "2",
    title: "Développeur Fullstack TypeScript",
    company: "DataCraft",
    location: "Remote",
    contractType: "CDI",
    remote: "full",
    skills: ["React", "Node.js", "PostgreSQL", "TypeScript"],
    description:
      "DataCraft cherche un profil fullstack pour travailler sur une plateforme de gestion de données avec React, Node.js et PostgreSQL.",
    source: "MockSource",
    url: "https://example.com/jobs/2",
    createdAt: "2026-05-12",
  },
];
export type JobOffer = {
  id: string;
  title: string;
  company: string;
  location: string;
  contractType: "CDI" | "CDD" | "Stage" | "Alternance" | "Freelance";
  remote: "none" | "partial" | "full";
  skills: string[];
  description: string;
  source: string;
  url: string;
  createdAt: string;
};
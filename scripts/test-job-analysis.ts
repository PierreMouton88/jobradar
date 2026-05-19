import { analyzeJobOffer } from "@/lib/ai/analyze-job-offer";

async function main() {
  const result = await analyzeJobOffer({
    title: "Développeur React Junior",
    company: "JobRadar Demo",
    location: "Remote",
    description:
      "Nous recherchons un développeur React junior avec des bases en TypeScript. Télétravail possible. Salaire 35 000€.",
    skills: ["React", "TypeScript"],
  });

  console.log("Analyse générée :");
  console.log(JSON.stringify(result.analysis, null, 2));

  console.log("Métadonnées :");
  console.log(JSON.stringify(result.metadata, null, 2));
}

main().catch((error) => {
  console.error("Erreur pendant le test d'analyse IA :");
  console.error(error);
  process.exit(1);
});

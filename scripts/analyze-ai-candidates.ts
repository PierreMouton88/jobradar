import { getAiAnalysisCandidates } from "@/lib/ai/get-ai-analysis-candidates";
import { getDefaultCandidateProfile } from "@/lib/search-context/get-active-search-context";
import { mapCandidateProfileToScoringProfile } from "@/lib/search-context/map-candidate-profile-to-scoring-profile";
import { analyzeAndSaveJobOffer } from "@/lib/ai/analyze-and-save-job-offer";

type CliOptions = {
  limit: number;
  dryRun: boolean;
  run: boolean;
};

function estimateRunTokens(candidatesCount: number) {
  const estimatedTokensPerOffer = 1500;

  return {
    estimatedTokensPerOffer,
    estimatedTotalTokens: candidatesCount * estimatedTokensPerOffer,
  };
}

function parseCliOptions(argv: string[]): CliOptions {
  const limitArg = argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.replace("--limit=", "")) : 5;
  const hasDryRun = argv.includes("--dry-run");
  const hasRun = argv.includes("--run");

  if (hasDryRun && hasRun) {
    throw new Error("Utilise soit --dry-run, soit --run, mais pas les deux.");
  }
  if (!Number.isInteger(limit) || limit < 0) {
    throw new Error("--limit doit être un nombre entier positif ou zéro.");
  }

  return {
    limit,
    dryRun: hasDryRun || !hasRun,
    run: hasRun,
  };
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));

  const profile = await getDefaultCandidateProfile();

  if (!profile) {
    throw new Error(
      "Aucun profil candidat actif trouvé. Lance le seed ou vérifie la table CandidateProfile.",
    );
  }

  const scoringProfile = mapCandidateProfileToScoringProfile(profile);

  const candidates = await getAiAnalysisCandidates({
    profile: scoringProfile,
    limit: options.limit,
  });

  console.log("");
  console.log("JobRadar IA — Analyse IA candidates");
  console.log("-----------------------------------");
  console.log(`Mode : ${options.dryRun ? "dry-run" : "run"}`);
  console.log(`Limite : ${options.limit}`);
  console.log(`Candidates sélectionnées : ${candidates.length}`);
  console.log("");

  if (candidates.length === 0) {
    console.log("Aucune offre candidate à analyser.");
    console.log("");
    return;
  }

  const estimatedRun = estimateRunTokens(candidates.length);

  console.log("Estimation indicative avant analyse :");
  console.log(`~${estimatedRun.estimatedTokensPerOffer} tokens par offre`);
  console.log(`~${estimatedRun.estimatedTotalTokens} tokens au total`);
  console.log("");

  console.log("Offres qui seraient analysées :");
  console.log("");

  candidates.forEach((candidate, index) => {
    console.log(`${index + 1}. ${candidate.offer.title ?? "Titre inconnu"}`);
    console.log(
      `   Entreprise : ${candidate.offer.company ?? "Non renseignée"}`,
    );
    console.log(`   Score : ${candidate.score.percentage}%`);
    console.log(
      `   Priorité : ${candidate.priority.label} (${candidate.priority.priority})`,
    );

    if (candidate.priority.reasons.length > 0) {
      console.log("   Raisons :");
      candidate.priority.reasons.forEach((reason) => {
        console.log(`   - [${reason.type}] ${reason.label}`);
      });
    }

    console.log(`   URL : ${candidate.offer.url ?? "Non renseignée"}`);
    console.log("");
  });

  if (options.dryRun) {
    console.log("Aucun appel IA effectué.");
    console.log("Le lancement réel nécessitera le flag explicite --run.");
    console.log("");
    return;
  }

  if (!options.run) {
    throw new Error(
      "Refus de lancer l'analyse IA sans le flag explicite --run.",
    );
  }

  console.log("Lancement des analyses IA...");
  console.log("");

  console.log("Mode réel confirmé par --run.");
  console.log("Les analyses vont être sauvegardées en base.");
  console.log("");

  for (const candidate of candidates) {
    console.log(`Analyse : ${candidate.offer.title ?? candidate.offer.id}`);

    const result = await analyzeAndSaveJobOffer(candidate.offer.id);

    console.log(
      `✓ Analyse sauvegardée — mode=${result.analysisMode}, tokens=${result.totalTokens}`,
    );
  }

  console.log("");
  console.log(`Analyses terminées : ${candidates.length}`);
  console.log("");
}

main().catch((error) => {
  console.error("");
  console.error("Erreur pendant la sélection des candidates IA :");
  console.error(error);
  console.error("");
  process.exit(1);
});

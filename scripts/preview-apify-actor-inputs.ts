import { getActiveSearchContext } from "@/lib/search-context/get-active-search-context";
import { mapSearchScenarioToJobSearchCriteria } from "@/lib/search/job-search-criteria";
import {
  getApifyActorAdapter,
  listApifyActorAdapters,
} from "@/lib/sources/apify/apify-actor-adapters";
import { buildApifyActorRunPlan } from "@/lib/sources/apify/apify-actor-run-plan";

type PreviewCliOptions = {
  source?: string;
  location?: string;
  limit?: number;
};

function parseCliOptions(args: string[]): PreviewCliOptions {
  let source: string | undefined;
  let location: string | undefined;
  let limit: number | undefined;

  for (const arg of args) {
    if (arg.startsWith("--source=")) {
      source = arg.replace("--source=", "");
      continue;
    }

    if (arg.startsWith("--location=")) {
      location = arg.replace("--location=", "");
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const value = Number(arg.replace("--limit=", ""));

      if (!Number.isInteger(value) || value <= 0) {
        throw new Error("L'option --limit doit être un entier positif.");
      }

      limit = value;
      continue;
    }

    throw new Error(`Argument inconnu : ${arg}`);
  }

  return {
    source,
    location,
    limit,
  };
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));

  const activeSearchContext = await getActiveSearchContext();

  if (!activeSearchContext) {
    throw new Error(
      "Aucun scénario de recherche actif trouvé. Vérifie qu'un SearchScenario isDefault=true et isActive=true existe en base.",
    );
  }

  const { candidateProfile, searchScenario } = activeSearchContext;

  const criteria = mapSearchScenarioToJobSearchCriteria(searchScenario);

  const adapters = options.source
    ? [getApifyActorAdapter(options.source)]
    : listApifyActorAdapters();

  console.log("\nJobRadar IA — Preview inputs Apify\n");

  console.log("Profil candidat actif");
  console.log("---------------------");
  console.log(`Nom : ${candidateProfile.name}`);
  console.log(`Headline : ${candidateProfile.headline}`);
  console.log("");

  console.log("Scénario de recherche actif");
  console.log("---------------------------");
  console.log(`Nom : ${searchScenario.name}`);
  console.log(`Description : ${searchScenario.description ?? "Aucune"}`);
  console.log("");

  console.log("Critères JobRadar nettoyés");
  console.log("--------------------------");
  console.log(JSON.stringify(criteria, null, 2));
  console.log("");

  console.log("Inputs Apify générés");
  console.log("--------------------");

  for (const adapter of adapters) {
  const runPlan = buildApifyActorRunPlan(adapter, criteria, {
    locations: options.location ? [options.location] : undefined,
    limit: options.limit,
    maxLocations: 3,
  });

  console.log("");
  console.log(`Source : ${adapter.source}`);
  console.log(`Actor : ${adapter.actorId}`);
  console.log(`Nom : ${adapter.displayName}`);
  console.log(`Limite par défaut : ${adapter.defaultLimit}`);
  console.log(`Runs prévus : ${runPlan.length}`);

  for (const [index, runPlanItem] of runPlan.entries()) {
    console.log("");
    console.log(`Run ${index + 1}/${runPlan.length}`);
    console.log(`Localisation : ${runPlanItem.location}`);
    console.log(`Limite : ${runPlanItem.limit}`);
    console.log(JSON.stringify(runPlanItem.input, null, 2));
  }
}

  console.log("");
  console.log("Aucun Actor Apify n'a été lancé.");
}

main().catch((error) => {
  console.error("Erreur pendant la preview des inputs Apify :");
  console.error(error);
  process.exit(1);
});
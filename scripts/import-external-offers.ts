// pour lancer la commande par defaut : npm run external:import -- --input=apify-actor --source=indeed --preset=indeed-nancy-dev-query --run-actor
// pour linkedin : npm run external:import -- --input=apify-actor --source=linkedin --preset=linkedin-grand-est-dev --run-actor

import { importExternalJobOffersToDb } from "@/lib/imports/import-external-job-offers-to-db";
import { getApifyActorInputPreset } from "@/lib/sources/apify/apify-actor-input-presets";
import {
  createExternalRawItemsLoader,
  type ExternalRawItemsInputKind,
} from "@/lib/sources/create-external-raw-items-loader";
import { mapExternalRawItem } from "@/lib/sources/map-external-raw-item";
import { getActiveSearchContext } from "@/lib/search-context/get-active-search-context";
import { mapSearchScenarioToJobSearchCriteria } from "@/lib/search/job-search-criteria";
import { getApifyActorAdapter } from "@/lib/sources/apify/apify-actor-adapters";
import { buildApifyActorRunPlan } from "@/lib/sources/apify/apify-actor-run-plan";

type SupportedExternalSource = "indeed" | "linkedin" | "meteojob";

type BaseCliOptions = {
  source: SupportedExternalSource;
  actor?: string;
  dryRun: boolean;
  limit?: number;
  runActor: boolean;
  location?: string;
};

type CliOptions =
  | (BaseCliOptions & {
      input: "json";
      filePath: string;
    })
  | (BaseCliOptions & {
      input: "apify-dataset";
      datasetId: string;
    })
  | (BaseCliOptions & {
      input: "apify-actor";
      preset?: string;
      fromScenario: boolean;
    });

function parseCliOptions(args: string[]): CliOptions {
  let source: SupportedExternalSource | null = null;
  let actor: string | undefined;
  let dryRun = false;
  let filePath: string | undefined;
  let limit: number | undefined;
  let input: ExternalRawItemsInputKind = "json";
  let datasetId: string | undefined;
  let preset: string | undefined;
  let runActor = false;
  let fromScenario = false;
  let location: string | undefined;

  for (const arg of args) {
    if (arg.startsWith("--source=")) {
  const value = arg.replace("--source=", "");

  if (value !== "indeed" && value !== "linkedin" && value !== "meteojob") {
    throw new Error(`Source non supportée : ${value}`);
  }

  source = value;
  continue;
}

    if (arg.startsWith("--actor=")) {
      actor = arg.replace("--actor=", "");
      continue;
    }

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--run-actor") {
      runActor = true;
      continue;
    }

    if (arg.startsWith("--input=")) {
      const value = arg.replace("--input=", "");

      if (
        value !== "json" &&
        value !== "apify-dataset" &&
        value !== "apify-actor"
      ) {
        throw new Error(`Type d'entrée non supporté : ${value}`);
      }

      input = value;
      continue;
    }

    if (arg.startsWith("--preset=")) {
      preset = arg.replace("--preset=", "");
      continue;
    }

    if (arg.startsWith("--dataset-id=")) {
      datasetId = arg.replace("--dataset-id=", "");
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
    if (arg === "--from-scenario") {
      fromScenario = true;
      continue;
    }

    if (arg.startsWith("--location=")) {
      location = arg.replace("--location=", "");
      continue;
    }

    if (!arg.startsWith("--")) {
      filePath = arg;
      continue;
    }

    throw new Error(`Argument inconnu : ${arg}`);
  }

  if (!source) {
    throw new Error(
      "Argument requis manquant : --source=indeed|linkedin|meteojob",
    );
  }

  if (input === "json") {
    if (!filePath) {
      throw new Error("Chemin du fichier JSON manquant.");
    }

    return {
      input,
      source,
      actor,
      filePath,
      dryRun,
      limit,
      runActor,
      location,
    };
  }

  if (input === "apify-dataset") {
    if (!datasetId) {
      throw new Error("Argument requis manquant : --dataset-id=...");
    }

    return {
      input,
      source,
      actor,
      datasetId,
      dryRun,
      limit,
      runActor,
      location,
    };
  }

  if (input === "apify-actor") {
    if (!preset && !fromScenario) {
      throw new Error(
        "Argument requis manquant : --preset=... ou --from-scenario",
      );
    }

    if (preset && fromScenario) {
      throw new Error(
        "Choisis soit --preset=..., soit --from-scenario, mais pas les deux.",
      );
    }

    return {
      input,
      source,
      actor,
      preset,
      fromScenario,
      dryRun,
      limit,
      runActor,
      location,
    };
  }

  const exhaustiveCheck: never = input;
  throw new Error(`Type d'entrée non supporté : ${exhaustiveCheck}`);
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }

  return value;
}

function formatSourceLabel(options: CliOptions): string {
  const detail =
    options.input === "apify-actor"
      ? options.fromScenario
        ? `scenario:${options.location ?? "default-location"}`
        : options.preset
      : (options.actor ?? "unknown");

  return ["external", options.source, options.input, detail].join(":");
}

async function createLoaderFromCliOptions(options: CliOptions) {
  switch (options.input) {
    case "json":
      return createExternalRawItemsLoader({
        input: "json",
        filePath: options.filePath,
      });

    case "apify-dataset":
      return createExternalRawItemsLoader({
        input: "apify-dataset",
        datasetId: options.datasetId,
        token: getRequiredEnv("APIFY_TOKEN"),
        limit: options.limit,
      });

    case "apify-actor": {
      if (!options.runActor) {
        throw new Error(
          "Le mode apify-actor lance réellement un Actor Apify. Ajoute --run-actor pour confirmer.",
        );
      }

      if (options.fromScenario) {
        const activeSearchContext = await getActiveSearchContext();

        if (!activeSearchContext) {
          throw new Error(
            "Aucun scénario de recherche actif trouvé. Vérifie qu'un SearchScenario isDefault=true et isActive=true existe en base.",
          );
        }

        const criteria = mapSearchScenarioToJobSearchCriteria(
          activeSearchContext.searchScenario,
        );

        const adapter = getApifyActorAdapter(options.source);

        const runPlan = buildApifyActorRunPlan(adapter, criteria, {
          locations: options.location ? [options.location] : undefined,
          limit: options.limit,
          maxLocations: 1,
        });

        const runPlanItem = runPlan[0];

        if (!runPlanItem) {
          throw new Error("Aucun run Apify généré depuis le scénario actif.");
        }

        console.log("");
        console.log("Input Apify généré depuis le scénario actif");
        console.log("------------------------------------------");
        console.log(`Source : ${runPlanItem.source}`);
        console.log(`Actor : ${options.actor ?? runPlanItem.actorId}`);
        console.log(`Localisation : ${runPlanItem.location}`);
        console.log(`Limite effective : ${runPlanItem.limit}`);
        console.log(JSON.stringify(runPlanItem.input, null, 2));
        console.log("");

        return createExternalRawItemsLoader({
          input: "apify-actor",
          token: getRequiredEnv("APIFY_TOKEN"),
          actorId: options.actor ?? runPlanItem.actorId,
          actorInput: runPlanItem.input,
          limit: runPlanItem.limit,
        });
      }

      if (!options.preset) {
        throw new Error("Argument requis manquant : --preset=...");
      }

      const preset = getApifyActorInputPreset(options.preset);

      if (preset.source !== options.source) {
        throw new Error(
          `Le preset ${options.preset} est prévu pour ${preset.source}, pas pour ${options.source}.`,
        );
      }

      return createExternalRawItemsLoader({
        input: "apify-actor",
        token: getRequiredEnv("APIFY_TOKEN"),
        actorId: options.actor ?? preset.actorId,
        actorInput: preset.input,
        limit: options.limit,
      });
    }

    default: {
      const exhaustiveCheck: never = options;
      throw new Error(
        `Options CLI non supportées : ${JSON.stringify(exhaustiveCheck)}`,
      );
    }
  }
}

function getDisplayActor(options: CliOptions): string {
  if (options.input === "apify-actor") {
    if (options.fromScenario) {
      const adapter = getApifyActorAdapter(options.source);

      return options.actor ?? adapter.actorId;
    }

    if (!options.preset) {
      return options.actor ?? "unknown";
    }

    const preset = getApifyActorInputPreset(options.preset);

    return options.actor ?? preset.actorId;
  }

  return options.actor ?? "unknown";
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));

  const loader = await createLoaderFromCliOptions(options);

  const { items: rawItems, metadata } = await loader.loadItems();

  const selectedRawItems = options.limit
    ? rawItems.slice(0, options.limit)
    : rawItems;

  const mappingResults = selectedRawItems.map((rawItem, index) =>
    mapExternalRawItem(rawItem, index, options.source, {
      sourceActor: options.actor ?? null,
    }),
  );

  const mappingErrors = mappingResults.filter((result) => !result.ok);

  const externalOffers = mappingResults
    .filter((result) => result.ok)
    .map((result) => result.offer);

  const report = await importExternalJobOffersToDb({
    externalOffers,
    sourceLabel: formatSourceLabel(options),
    dryRun: options.dryRun,
  });

  console.log("\nExternal import report\n");
  console.log(`Input: ${options.input}`);
  console.log(`Source: ${options.source}`);
  console.log(`Actor: ${getDisplayActor(options)}`);
  console.log(`Dry run: ${report.dryRun}`);
  console.log(`Requested limit: ${options.limit ?? "none"}`);
  console.log(`Run actor: ${options.runActor}`);
  console.log("");
  console.log(`Loader source: ${metadata.sourceLabel}`);
  console.log(`Loaded at: ${metadata.loadedAt}`);
  console.log(`Raw items loaded: ${metadata.itemCount}`);
  console.log(`Raw items selected: ${selectedRawItems.length}`);
  console.log(`Mapping succeeded: ${externalOffers.length}`);
  console.log(`Mapping errors: ${mappingErrors.length}`);
  console.log("");
  console.log(`Total external offers: ${report.totalExternalOffers}`);
  console.log(`Prepared offers: ${report.preparedOffers}`);
  console.log(`Unique offers: ${report.uniqueOffers}`);
  console.log(`Duplicates skipped: ${report.duplicatesSkipped}`);
  console.log(`Preview errors: ${report.previewErrors}`);
  console.log("");
  console.log(`Created: ${report.created}`);
  console.log(`Updated: ${report.updated}`);
  console.log(`Errors: ${report.errors.length}`);
  console.log(`Scraping run id: ${report.scrapingRunId ?? "none"}`);

  if (options.input === "apify-actor") {
    console.log(`Preset: ${options.preset ?? "none"}`);
    console.log(`From scenario: ${options.fromScenario}`);
    console.log(`Location override: ${options.location ?? "none"}`);
  }
  if (mappingErrors.length > 0) {
    console.log("\nMapping errors:");
    for (const error of mappingErrors) {
      console.log(`- ${JSON.stringify(error)}`);
    }
  }

  if (report.errors.length > 0) {
    console.log("\nErrors:");
    for (const error of report.errors) {
      console.log(`- ${error}`);
    }
  }
}

main().catch((error) => {
  console.error("Erreur pendant l'import externe :");
  console.error(error);
  process.exit(1);
});

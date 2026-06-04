import { JsonFileExternalRawItemsLoader } from "@/lib/sources/json-file-external-raw-items-loader";
import { mapExternalRawItem } from "@/lib/sources/map-external-raw-item";
import { importExternalJobOffersToDb } from "@/lib/imports/import-external-job-offers-to-db";

type SupportedExternalSource = "indeed" | "linkedin";

type CliOptions = {
  source: SupportedExternalSource;
  actor?: string;
  filePath: string;
  dryRun: boolean;
};

function parseCliOptions(args: string[]): CliOptions {
  let source: SupportedExternalSource | null = null;
  let actor: string | undefined;
  let dryRun = false;
  let filePath: string | undefined;

  for (const arg of args) {
    if (arg.startsWith("--source=")) {
      const value = arg.replace("--source=", "");

      if (value !== "indeed" && value !== "linkedin") {
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

    if (!arg.startsWith("--")) {
      filePath = arg;
      continue;
    }

    throw new Error(`Argument inconnu : ${arg}`);
  }

  if (!source) {
    throw new Error("Argument requis manquant : --source=indeed|linkedin");
  }

  if (!filePath) {
    throw new Error("Chemin du fichier JSON manquant.");
  }

  return {
    source,
    actor,
    filePath,
    dryRun,
  };
}

function formatSourceLabel(options: CliOptions): string {
  return ["external", options.source, "json", options.actor ?? "unknown"].join(
    ":",
  );
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));

  const loader = new JsonFileExternalRawItemsLoader({
    filePath: options.filePath,
  });
  const { items: rawItems } = await loader.loadItems();

  const mappingResults = rawItems.map((rawItem, index) =>
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
  console.log(`Source: ${options.source}`);
  console.log(`Actor: ${options.actor ?? "unknown"}`);
  console.log(`Dry run: ${report.dryRun}`);
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
  console.log("");
  console.log(`Raw items loaded: ${rawItems.length}`);
  console.log(`Mapping succeeded: ${externalOffers.length}`);
  console.log(`Mapping errors: ${mappingErrors.length}`);

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

import { JsonFileExternalRawItemsLoader } from "@/lib/sources/json-file-external-raw-items-loader";
import { mapExternalRawItem } from "@/lib/sources/map-external-raw-item";
import {
  prepareExternalOfferForDb,
  previewExternalJobOffersImport,
} from "../lib/offers/import-external-job-offers";

type SupportedExternalSource = "indeed" | "linkedin";

function getSourceArg(): SupportedExternalSource {
  const sourceArg = process.argv.find((arg) => arg.startsWith("--source="));
  const source = sourceArg?.replace("--source=", "");

  if (source === "indeed" || source === "linkedin") {
    return source;
  }

  throw new Error(
    "Source manquante ou invalide. Utilise --source=indeed ou --source=linkedin.",
  );
}

async function main() {
  const source = getSourceArg();

  const filePathArg = process.argv.find((arg) => arg.endsWith(".json"));
  const sourceActorArg = process.argv.find((arg) => arg.startsWith("--actor="));

  if (!filePathArg) {
    throw new Error(
      "Usage: npm run external:preview -- --source=indeed --actor=creator/actor ./data/external/export.json",
    );
  }

  const sourceActor =
    sourceActorArg?.replace("--actor=", "") ?? "unknown-apify-actor";

  const importedAt = new Date().toISOString();

  const loader = new JsonFileExternalRawItemsLoader({
    filePath: filePathArg,
  });

  const loadResult = await loader.loadItems();
  const rawItems = loadResult.items;

  const mappedOffers = rawItems.map((rawItem: unknown, index: number) =>
    mapExternalRawItem(rawItem, index, source, {
      sourceActor,
      importedAt,
    }),
  );

  const validOffers = mappedOffers.filter((item) => item.ok);
  const invalidOffers = mappedOffers.filter((item) => !item.ok);
  const externalOffers = validOffers.map((item) => item.offer);
const importPreviewReport = previewExternalJobOffersImport(externalOffers);

  console.log("\nPreview préparation import V2");
console.log("-----------------------------");
console.log(`Total offres externes : ${importPreviewReport.totalOffers}`);
console.log(`Offres préparées : ${importPreviewReport.preparedOffers.length}`);
console.log(`Erreurs de préparation : ${importPreviewReport.errors.length}`);
console.log(`Offres uniques : ${importPreviewReport.uniqueOffers.length}`);
console.log(`Doublons détectés : ${importPreviewReport.duplicates.length}`);
console.log("\nAperçu des 5 premières offres préparées :");

for (const preparedOffer of importPreviewReport.preparedOffers.slice(0, 5)) {
  console.log({
    externalId: preparedOffer.externalId,
    title: preparedOffer.title,
    company: preparedOffer.company,
    normalizedSourceUrl: preparedOffer.normalizedSourceUrl,
    normalizedContractType: preparedOffer.normalizedContractType,
    detectedRemote: preparedOffer.detectedRemote,
    detectedSkills: preparedOffer.detectedSkills,
    sourceTags: preparedOffer.sourceTags,
  });
}
console.log("\nPreview données prêtes pour DB");
console.log("------------------------------");

for (const uniqueOffer of importPreviewReport.uniqueOffers.slice(0, 5)) {
  const dbOffer = prepareExternalOfferForDb(uniqueOffer);

  console.log({
    title: dbOffer.title,
    company: dbOffer.company,
    location: dbOffer.location,
    contractType: dbOffer.contractType,
    remote: dbOffer.remote,
    skills: dbOffer.skills,
    source: dbOffer.source,
    url: dbOffer.url,
    scrapedAt: dbOffer.scrapedAt.toString(),
    qualityScore: dbOffer.qualityScore,
    qualityIssues: dbOffer.qualityIssues,
  });
}
if (importPreviewReport.errors.length > 0) {
  console.log("\nPremières erreurs de préparation :");

  for (const error of importPreviewReport.errors.slice(0, 3)) {
    console.log(error);
  }
}
if (importPreviewReport.duplicates.length > 0) {
  console.log("\nPremiers doublons détectés :");

  for (const duplicate of importPreviewReport.duplicates.slice(0, 5)) {
    console.log(duplicate);
  }
}
}

main().catch((error) => {
  console.error("Erreur pendant la preview d'import externe :");
  console.error(error);
  process.exit(1);
});

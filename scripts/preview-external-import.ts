import { JsonFileExternalRawItemsLoader } from "@/lib/sources/json-file-external-raw-items-loader";
import { mapExternalRawItem } from "@/lib/sources/map-external-raw-item";

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

  console.log("Preview import externe");
  console.log("----------------------");
  console.log(`Source brute : ${loadResult.metadata.sourceLabel}`);
  console.log(`Chargé à : ${loadResult.metadata.loadedAt}`);
  console.log(`Total items : ${rawItems.length}`);
  console.log(`Valides : ${validOffers.length}`);
  console.log(`Invalides : ${invalidOffers.length}`);
  console.log(`Source : ${source}`);
  console.log(`Actor : ${sourceActor}`);
  console.log(`Importé à : ${importedAt}`);

  console.log("\nAperçu des 5 premières offres valides :");

  for (const item of validOffers.slice(0, 5)) {
    console.log({
      externalId: item.offer.externalId,
      sourceProvider: item.offer.sourceProvider,
      sourceName: item.offer.sourceName,
      sourceActor: item.offer.sourceActor,
      title: item.offer.title,
      company: item.offer.company,
      location: item.offer.location,
      contractType: item.offer.contractType,
      sourceUrl: item.offer.sourceUrl,
    });
  }

  if (invalidOffers.length > 0) {
    console.log("\nPremières erreurs de validation :");

    for (const item of invalidOffers.slice(0, 3)) {
      console.log({
        index: item.index,
        error: item.error,
      });
    }
  }
}

main().catch((error) => {
  console.error("Erreur pendant la preview d'import externe :");
  console.error(error);
  process.exit(1);
});

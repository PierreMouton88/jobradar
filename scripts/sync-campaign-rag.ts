import { executeCampaignRagSync } from "@/lib/rag/execute-campaign-rag-sync";

function hasFlag(name: string): boolean {
  return process.argv
    .slice(2)
    .includes(`--${name}`);
}

function getArgumentValue(name: string): string | null {
  const prefix = `--${name}=`;

  const argument = process.argv
    .slice(2)
    .find((value) => value.startsWith(prefix));

  return argument
    ? argument.slice(prefix.length)
    : null;
}

function getIntegerArgument(
  name: string,
  fallback: number,
): number {
  const rawValue = getArgumentValue(name);

  if (rawValue === null) {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 0
  ) {
    throw new Error(
      `--${name} must be a non-negative integer.`,
    );
  }

  return parsedValue;
}

async function main() {
  const campaignId = getArgumentValue("campaign-id");

  if (!campaignId) {
    throw new Error(
      [
        "L’option --campaign-id est obligatoire.",
        "",
        "Preview borné :",
        "npm run rag:campaign:sync -- --campaign-id=ID",
        "",
        "Exécution réelle :",
        "npm run rag:campaign:sync -- --campaign-id=ID --execute --max-documents=2 --max-embeddings=2",
      ].join("\n"),
    );
  }

  const execute = hasFlag("execute");
  const maxDocuments = getIntegerArgument(
    "max-documents",
    10,
  );
  const maxEmbeddings = getIntegerArgument(
    "max-embeddings",
    5,
  );

  const result = await executeCampaignRagSync({
    campaignId,
    execute,
    maxDocuments,
    maxEmbeddings,
  });

  console.log("\nSynchronisation RAG par campagne");
  console.log("================================");
  console.log(`Campagne : ${result.preview.campaign.id}`);
  console.log(`Mode : ${result.mode}`);
  console.log(
    `Limite documents : ${maxDocuments}`,
  );
  console.log(
    `Limite embeddings : ${maxEmbeddings}`,
  );

  console.log("\nSélection");
  console.log("---------");
  console.log(
    `Documents sélectionnés : ${result.selection.summary.selectedDocuments}`,
  );
  console.log(
    `Embeddings sélectionnés : ${result.selection.summary.selectedEmbeddings}`,
  );
  console.log(
    `Mises à jour sans embedding : ${result.selection.summary.selectedWithoutEmbedding}`,
  );
  console.log(
    `Déjà à jour : ${result.selection.summary.skippedUpToDate}`,
  );
  console.log(
    `Ignorés par limite documents : ${result.selection.summary.skippedByDocumentLimit}`,
  );
  console.log(
    `Ignorés par limite embeddings : ${result.selection.summary.skippedByEmbeddingLimit}`,
  );

  if (result.items.length > 0) {
    console.log("\nRésultats");
    console.log("---------");

    for (const item of result.items) {
      console.log(
        [
          `- [${item.status}] [${item.action}] ${item.title}`,
          `  sourceId : ${item.sourceId}`,
          `  embedding : ${
            item.requiresEmbedding ? "oui" : "non"
          }`,
          item.embeddingDimensions
            ? `  dimensions : ${item.embeddingDimensions}`
            : null,
          item.errorMessage
            ? `  erreur : ${item.errorMessage}`
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }
  }

  console.log("\nBilan");
  console.log("-----");
  console.log(
    `Documents planifiés : ${result.summary.plannedDocuments}`,
  );
  console.log(
    `Embeddings planifiés : ${result.summary.plannedEmbeddings}`,
  );
  console.log(
    `Documents réussis : ${result.summary.successfulDocuments}`,
  );
  console.log(
    `Documents créés : ${result.summary.createdDocuments}`,
  );
  console.log(
    `Documents mis à jour : ${result.summary.updatedDocuments}`,
  );
  console.log(
    `Embeddings générés : ${result.summary.generatedEmbeddings}`,
  );
  console.log(`Erreurs : ${result.summary.errors}`);

  if (result.mode === "DRY_RUN") {
    console.log(
      "\nDry-run terminé. Aucun appel OpenAI et aucune écriture n’ont été effectués.",
    );
  }

  if (
    result.mode === "EXECUTE" &&
    result.summary.errors > 0
  ) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(
    "\nErreur pendant la synchronisation RAG :",
    error,
  );

  process.exit(1);
});
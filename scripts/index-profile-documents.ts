import { createRagDocumentEmbedding } from "@/lib/rag/create-rag-document-embedding";
import { readProfileDocuments } from "@/lib/rag/read-profile-documents";

function hasDryRunFlag(): boolean {
  return process.argv.includes("--dry-run");
}

async function main() {
  const dryRun = hasDryRunFlag();
  const documents = await readProfileDocuments();

  console.log("JobRadar IA — Indexation documents profil RAG");
  console.log("---------------------------------------------");
  console.log(`Mode : ${dryRun ? "dry-run" : "indexation réelle"}`);
  console.log(`Documents détectés : ${documents.length}`);
  console.log("");

  if (documents.length === 0) {
    console.log("Aucun document Markdown trouvé dans data/profile/.");
    return;
  }

  for (const document of documents) {
    console.log(`Document : ${document.title}`);
    console.log(`Source id : ${document.sourceId}`);
    console.log(`Fichier : ${document.metadata.relativePath}`);
    console.log(`Taille : ${document.content.length} caractères`);

    if (dryRun) {
      console.log("Résultat : ignoré en dry-run");
      console.log("");
      continue;
    }

    await createRagDocumentEmbedding({
      sourceType: document.sourceType,
      sourceId: document.sourceId,
      title: document.title,
      content: document.content,
      metadata: document.metadata,
    });

    console.log("Résultat : indexé");
    console.log("");
  }

  console.log("Indexation terminée.");
}

main().catch((error) => {
  console.error("Erreur pendant l’indexation des documents profil RAG.");
  console.error(error);
  process.exit(1);
});
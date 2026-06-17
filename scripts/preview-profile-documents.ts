import { readProfileDocuments } from "@/lib/rag/read-profile-documents";

function truncateContent(content: string, maxLength = 500): string {
  if (content.length <= maxLength) {
    return content;
  }

  return `${content.slice(0, maxLength)}...`;
}

async function main() {
  const documents = await readProfileDocuments();

  console.log("JobRadar IA — Preview documents profil RAG");
  console.log("------------------------------------------");
  console.log(`Documents détectés : ${documents.length}`);
  console.log("");

  if (documents.length === 0) {
    console.log("Aucun document Markdown trouvé dans data/profile/.");
    return;
  }

  for (const document of documents) {
    console.log(`Titre : ${document.title}`);
    console.log(`Source type : ${document.sourceType}`);
    console.log(`Source id : ${document.sourceId}`);
    console.log(`Fichier : ${document.metadata.relativePath}`);
    console.log(`Taille : ${document.content.length} caractères`);
    console.log("");
    console.log(truncateContent(document.content));
    console.log("");
    console.log("------------------------------------------");
  }
}

main().catch((error) => {
  console.error("Erreur pendant la preview des documents profil RAG.");
  console.error(error);
  process.exit(1);
});
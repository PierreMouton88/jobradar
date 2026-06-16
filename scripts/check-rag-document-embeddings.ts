import { prisma } from "@/lib/prisma";

async function main() {
  const documents = await prisma.ragDocumentEmbedding.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      sourceType: true,
      sourceId: true,
      title: true,
      modelName: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  console.log("=== Documents RAG génériques indexés ===");
  console.log(`Total : ${documents.length}`);

  for (const document of documents) {
    console.log("\n---");
    console.log(`Type : ${document.sourceType}`);
    console.log(`Source ID : ${document.sourceId}`);
    console.log(`Titre : ${document.title}`);
    console.log(`Modèle : ${document.modelName}`);
    console.log(`Créé le : ${document.createdAt.toISOString()}`);
    console.log(`Mis à jour le : ${document.updatedAt.toISOString()}`);
  }
}

main().catch((error) => {
  console.error(
    "Erreur pendant la vérification des documents RAG génériques :",
    error,
  );

  process.exit(1);
});
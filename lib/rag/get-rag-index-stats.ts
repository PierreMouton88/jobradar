import { prisma } from "@/lib/prisma";

export async function getRagIndexStats() {
  const genericDocuments = await prisma.ragDocumentEmbedding.findMany({
    select: {
      sourceType: true,
    },
  });

  const genericDocumentsByType = genericDocuments.reduce<Record<string, number>>(
    (acc, document) => {
      acc[document.sourceType] = (acc[document.sourceType] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return {
    genericDocumentsCount: genericDocuments.length,
    genericDocumentsByType,
  };
}
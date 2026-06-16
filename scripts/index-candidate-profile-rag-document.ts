import { createRagDocumentEmbedding } from "@/lib/rag/create-rag-document-embedding";
import { buildCandidateProfileRagDocument } from "@/lib/rag/candidate-profile-rag-document";
import { mapActiveSearchContextToCandidateProfileRagInput } from "@/lib/rag/map-active-search-context-to-candidate-profile-rag-input";
import { getActiveSearchContext } from "@/lib/search-context/get-active-search-context";

async function main() {
  const context = await getActiveSearchContext();

  if (!context) {
    throw new Error(
      "Aucun contexte de recherche actif trouvé. Vérifie le seed CandidateProfile/SearchScenario.",
    );
  }

  const ragInput = mapActiveSearchContextToCandidateProfileRagInput(context);
  const content = buildCandidateProfileRagDocument(ragInput);

  console.log("Indexation du profil candidat dans RagDocumentEmbedding...");
  console.log(`Profil : ${context.candidateProfile.name}`);
  console.log(`Scénario : ${context.searchScenario.name}`);

  const result = await createRagDocumentEmbedding({
    sourceType: "candidate_profile",
    sourceId: context.candidateProfile.id,
    title: `Profil candidat — ${context.candidateProfile.name}`,
    content,
    metadata: {
      candidateProfileId: context.candidateProfile.id,
      candidateProfileName: context.candidateProfile.name,
      searchScenarioId: context.searchScenario.id,
      searchScenarioName: context.searchScenario.name,
      targetRoles: context.candidateProfile.targetRoles,
      locations: context.searchScenario.locations,
    },
  });

  console.log("\nDocument RAG indexé avec succès.");
  console.log(`Type : ${result.sourceType}`);
  console.log(`Source ID : ${result.sourceId}`);
  console.log(`Titre : ${result.title}`);
  console.log(`Dimensions embedding : ${result.embeddingDimensions}`);
}

main().catch((error) => {
  console.error(
    "Erreur pendant l’indexation du document RAG profil candidat :",
    error,
  );

  process.exit(1);
});
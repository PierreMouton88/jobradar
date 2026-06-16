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
  const document = buildCandidateProfileRagDocument(ragInput);

  console.log("=== Document RAG — Profil candidat actif ===\n");
  console.log(document);
}

main().catch((error) => {
  console.error(
    "Erreur pendant la prévisualisation du document RAG profil :",
    error,
  );

  process.exit(1);
});
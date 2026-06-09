import { getActiveSearchContext } from "@/lib/search-context/get-active-search-context";

async function main() {
  const context = await getActiveSearchContext();

  if (!context) {
    console.log("No active search context found.");
    return;
  }

  console.log("Candidate profile:");
  console.log(`- ${context.candidateProfile.name}`);
  console.log(`- ${context.candidateProfile.headline}`);
  console.log(`- Level: ${context.candidateProfile.level}`);

  console.log("");

  console.log("Search scenario:");
  console.log(`- ${context.searchScenario.name}`);
  console.log(`- Locations: ${context.searchScenario.locations.join(", ")}`);
  console.log(`- Keywords: ${context.searchScenario.keywords.join(", ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
import { searchOffersForAgent } from "@/lib/agent/search-offers-for-agent";

async function main() {
  const results = await searchOffersForAgent("React");

  console.log("Résultats trouvés :", results.length);

  for (const offer of results) {
    console.log({
      id: offer.id,
      title: offer.title,
      company: offer.company,
      location: offer.location,
      contractType: offer.contractType,
      remote: offer.remote,
      skills: offer.skills,
    });
  }
}

main().catch((error) => {
  console.error("Erreur pendant le test agent searchOffers :", error);
  process.exit(1);
});
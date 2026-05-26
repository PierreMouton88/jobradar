import { getOfferDetailsForAgent } from "@/lib/agent/get-offer-details-for-agent";

async function main() {
  const offerId = "cmpcpr47h0001lwvux2m6kwdb";

  const offer = await getOfferDetailsForAgent(offerId);

  if (!offer) {
    console.log("Offre introuvable");
    return;
  }

  console.log({
    id: offer.id,
    title: offer.title,
    company: offer.company,
    location: offer.location,
    contractType: offer.contractType,
    remote: offer.remote,
    skills: offer.skills,
    hasAnalysis: offer.analysis !== null,
    summary: offer.analysis?.summary,
  });
}

main().catch((error) => {
  console.error("Erreur pendant le test getOfferDetails :", error);
  process.exit(1);
});
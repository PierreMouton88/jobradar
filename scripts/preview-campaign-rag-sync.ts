import { getCampaignRagSyncPreview } from "@/lib/rag/get-campaign-rag-sync-preview";

function getArgumentValue(name: string): string | null {
  const prefix = `--${name}=`;
  const argument = process.argv
    .slice(2)
    .find((value) => value.startsWith(prefix));

  return argument ? argument.slice(prefix.length) : null;
}

function formatDate(value: Date | null): string {
  return value ? value.toISOString() : "Non terminée";
}

async function main() {
  const campaignId = getArgumentValue("campaign-id");

  if (!campaignId) {
    throw new Error(
      [
        "L’option --campaign-id est obligatoire.",
        "",
        "Exemple :",
        "npm run rag:campaign:preview -- --campaign-id=CAMPAIGN_ID",
      ].join("\n"),
    );
  }

  const preview = await getCampaignRagSyncPreview(campaignId);

  console.log("\nSynchronisation RAG par campagne — preview");
  console.log("==========================================");
  console.log(`Campagne : ${preview.campaign.id}`);
  console.log(`Statut : ${preview.campaign.status}`);
  console.log(
    `Campagne dry-run : ${preview.campaign.dryRun ? "oui" : "non"}`,
  );
  console.log(
    `Démarrée : ${preview.campaign.startedAt.toISOString()}`,
  );
  console.log(
    `Terminée : ${formatDate(preview.campaign.finishedAt)}`,
  );

  if (preview.campaign.dryRun) {
    console.warn(
      "\nAttention : cette campagne était une campagne dry-run.",
    );
  }

  console.log("\nRésumé");
  console.log("------");
  console.log(
    `Offres sélectionnées : ${preview.summary.selectedOffers}`,
  );
  console.log(`Offres trouvées : ${preview.summary.foundOffers}`);
  console.log(`Offres manquantes : ${preview.summary.missingOffers}`);
  console.log(`Documents à créer : ${preview.summary.create}`);
  console.log(`Documents à mettre à jour : ${preview.summary.update}`);
  console.log(`Documents déjà à jour : ${preview.summary.upToDate}`);
  console.log(
    `Embeddings nécessaires : ${preview.summary.requiringEmbedding}`,
  );

  if (preview.missingJobOfferIds.length > 0) {
    console.log("\nOffres locales manquantes");
    console.log("-------------------------");

    for (const jobOfferId of preview.missingJobOfferIds) {
      console.log(`- ${jobOfferId}`);
    }
  }

  if (preview.plan.length === 0) {
    console.log(
      "\nAucune offre CREATED ou UPDATED à synchroniser.",
    );
    return;
  }

  console.log("\nPlan");
  console.log("----");

  for (const item of preview.plan) {
    const reasons =
      item.reasons.length > 0
        ? item.reasons.join(", ")
        : "aucune modification";

    console.log(
      [
        `- [${item.action}] ${item.candidate.title}`,
        `  sourceId : ${item.candidate.sourceId}`,
        `  embedding : ${
          item.requiresEmbedding ? "nécessaire" : "non nécessaire"
        }`,
        `  raisons : ${reasons}`,
      ].join("\n"),
    );
  }

  console.log(
    "\nPreview terminé. Aucun embedding n’a été généré et aucune donnée n’a été modifiée.",
  );
}

main().catch((error) => {
  console.error(
    "\nErreur pendant le preview de synchronisation RAG :",
    error,
  );

  process.exit(1);
});
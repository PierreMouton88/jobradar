import { runJobAgent } from "@/lib/agent/run-job-agent";

async function main() {
  const result = await runJobAgent({
    prompt:
      "Trouve une offre React junior, puis donne-moi plus de détails sur la première offre trouvée. Réponds de façon courte.",
  });

  console.log("Réponse agent :");
  console.log(result.answer);

  console.log("\nTools utilisés :");

  if (result.toolCalls.length === 0) {
    console.log("- Aucun tool utilisé");
  } else {
    for (const toolCall of result.toolCalls) {
      console.log(`- ${toolCall.toolName}`);
      console.log("  input:", toolCall.input);
      console.log(`  résultat: ${toolCall.outputSummary}`);
    }
  }

  console.log("\nUsage tokens :");
  console.log(result.usage);
}

main().catch((error) => {
  console.error("Erreur pendant le test agent :", error);
  process.exit(1);
});
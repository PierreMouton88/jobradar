import "dotenv/config";

import { buildDailyJobRadarWorkflowPlan } from "@/lib/workflows/build-daily-jobradar-workflow-plan";
import { formatDailyJobRadarWorkflowPlan } from "@/lib/workflows/format-daily-jobradar-workflow-plan";
import { getDailyJobRadarWorkflowConfig } from "@/lib/workflows/daily-jobradar-workflow-config";

function main() {
  const config = getDailyJobRadarWorkflowConfig();
  const plan = buildDailyJobRadarWorkflowPlan(config);
  const output = formatDailyJobRadarWorkflowPlan(plan);

  console.log(output);
}

try {
  main();
} catch (error) {
  console.error("");
  console.error(
    "Erreur pendant la lecture de la configuration du workflow quotidien :",
  );
  console.error(error);
  console.error("");

  process.exitCode = 1;
}
import { buildJobRadarReportEmailPreview } from "@/lib/reports/build-jobradar-report-email-preview";
import { readLatestJobRadarReport } from "@/lib/reports/read-latest-jobradar-report";

async function main() {
  const report = await readLatestJobRadarReport();

  if (!report) {
    console.error("Aucun rapport JobRadar trouvé dans le dossier reports/.");
    console.error("");
    console.error("Génère d’abord un rapport avec :");
    console.error("");
    console.error("  npm run report:generate");
    console.error("");

    process.exitCode = 1;
    return;
  }

  const preview = buildJobRadarReportEmailPreview(report);

  console.log("JobRadar IA — Preview email");
  console.log("-----------------------------------");
  console.log("Mode : dry-run / preview uniquement");
  console.log("Envoi réel : non");
  console.log("");
  console.log(`Rapport source : ${preview.sourceReportPath}`);
  console.log("");
  console.log(`Sujet : ${preview.subject}`);
  console.log("");
  console.log("Corps :");
  console.log("-----------------------------------");
  console.log(preview.body);
}

main().catch((error) => {
  console.error("Failed to build report email preview:", error);
  process.exitCode = 1;
});


import "dotenv/config";
import { buildJobRadarReportEmailPreview } from "@/lib/reports/build-jobradar-report-email-preview";
import { readLatestJobRadarReport } from "@/lib/reports/read-latest-jobradar-report";
import { getEmailSmtpConfig } from "@/lib/distribution/email-smtp-config";
import { sendEmailWithSmtp } from "@/lib/distribution/send-email-with-smtp";

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function main() {
  const shouldSend = hasFlag("--send");

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

 const preview = buildJobRadarReportEmailPreview(
  report,
  {
    appBaseUrl:
      process.env.JOBRADAR_APP_BASE_URL,
  },
);

  console.log("JobRadar IA — Email report");
  console.log("-----------------------------------");
  console.log(`Mode : ${shouldSend ? "send" : "dry-run"}`);
  console.log(`Rapport source : ${preview.sourceReportPath}`);
  console.log(`Sujet : ${preview.subject}`);
  console.log("");

  if (!shouldSend) {
    console.log("Aucun email envoyé.");
    console.log("");
    console.log("Pour envoyer réellement :");
    console.log("");
    console.log("  npm run report:email:send -- --send");
    console.log("");
    console.log("Preview du corps :");
    console.log("-----------------------------------");
    console.log(preview.body);

    return;
  }

  const config = getEmailSmtpConfig();

  const result = await sendEmailWithSmtp(
  {
    subject: preview.subject,
    text: preview.text,
    html: preview.html,
  },
  config,
);

  console.log("Email envoyé.");
  console.log(`Message ID : ${result.messageId}`);
  console.log(`Acceptés : ${result.accepted.join(", ") || "aucun"}`);
  console.log(`Rejetés : ${result.rejected.join(", ") || "aucun"}`);
}

main().catch((error) => {
  console.error("Failed to send report email:", error);
  process.exitCode = 1;
});
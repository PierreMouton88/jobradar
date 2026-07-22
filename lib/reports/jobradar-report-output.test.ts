import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildJobRadarCampaignUrl,
  buildJobRadarOfferUrl,
  buildJobRadarReportFilename,
  buildJobRadarReportPath,
} from "@/lib/reports/jobradar-report-output";

describe("jobradar-report-output", () => {
  it("utilise localhost comme URL de développement par défaut", () => {
    const url = buildJobRadarOfferUrl({
      jobOfferId: "offer-1",
    });

    expect(url).toBe(
      "http://localhost:3000/offers/offer-1",
    );
  });

  it("normalise l’URL publique et encode les identifiants", () => {
    const offerUrl = buildJobRadarOfferUrl({
      jobOfferId: "offer/avec espaces",
      appBaseUrl: "https://jobradar.example.com///",
    });

    const campaignUrl = buildJobRadarCampaignUrl({
      campaignId: "campaign/123",
      appBaseUrl: "https://jobradar.example.com/",
    });

    expect(offerUrl).toBe(
      "https://jobradar.example.com/offers/offer%2Favec%20espaces",
    );

    expect(campaignUrl).toBe(
      "https://jobradar.example.com/imports/campaign%2F123",
    );
  });

  it("conserve le nom historique pour un rapport global", () => {
    const filename = buildJobRadarReportFilename({
      now: new Date("2026-07-21T06:00:00.000Z"),
      scope: {
        type: "global",
      },
    });

    expect(filename).toBe(
      "jobradar-report-2026-07-21.md",
    );
  });

  it("génère un nom distinct pour une campagne précise", () => {
    const filename = buildJobRadarReportFilename({
      now: new Date("2026-07-21T06:00:00.000Z"),
      scope: {
        type: "campaign",
        campaignId: "campaign-123",
      },
    });

    expect(filename).toBe(
      "jobradar-report-2026-07-21-campaign-123.md",
    );
  });

  it("distingue les rapports récents selon leur fenêtre", () => {
    const filename = buildJobRadarReportFilename({
      now: new Date("2026-07-21T06:00:00.000Z"),
      scope: {
        type: "recent-hours",
        recentHours: 24,
      },
    });

    expect(filename).toBe(
      "jobradar-report-2026-07-21-recent-24h.md",
    );
  });

  it("construit le chemin dans le dossier explicitement fourni", () => {
    const reportPath = buildJobRadarReportPath({
      reportsDir: "/tmp/jobradar-reports",
      now: new Date("2026-07-21T06:00:00.000Z"),
      scope: {
        type: "campaign",
        campaignId: "campaign-123",
      },
    });

    expect(reportPath).toBe(
      path.join(
        "/tmp/jobradar-reports",
        "jobradar-report-2026-07-21-campaign-123.md",
      ),
    );
  });

  it("refuse un identifiant de campagne inutilisable", () => {
    expect(() =>
      buildJobRadarReportFilename({
        now: new Date("2026-07-21T06:00:00.000Z"),
        scope: {
          type: "campaign",
          campaignId: "///",
        },
      }),
    ).toThrow(
      "Impossible de construire le nom du rapport avec un identifiant vide.",
    );
  });
});
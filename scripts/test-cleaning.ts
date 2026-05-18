import {
  cleanText,
  cleanOptionalText,
  normalizeUrl,
  cleanScrapedOffer,
} from "@/lib/offers/offer-cleaning";
import { detectSkills, detectRemote } from "@/lib/offers/offer-normalization";
import {
  buildOfferDeduplicationKey,
  deduplicateOffers,
  deduplicateOffersWithReport,
} from "@/lib/offers/offer-deduplication";
import { analyzeOfferQuality } from "@/lib/offers/offer-quality";

// --- Cleaning ---

console.log(cleanText("  Développeur   React \n\n TypeScript  "));
console.log(cleanOptionalText(undefined));
console.log(cleanOptionalText("   CDI   "));

console.log(
  normalizeUrl(
    " https://example.com/jobs/react-dev?utm_source=linkedin#details "
  )
);

console.log(
  normalizeUrl("/jobs/react-dev?utm_campaign=test", "https://example.com")
);

console.log(normalizeUrl("https://example.com/jobs/react-dev/"));

const dirtyOffer = {
  title: "  Développeur   React  ",
  company: " ACME ",
  location: " Paris \n Télétravail ",
  contractType: " CDI ",
  description: " Nous cherchons...\n\nReact TypeScript ",
  url: " https://example.com/jobs/react-dev/?utm_source=test#details ",
  source: " static ",
  scrapedAt: new Date().toISOString(),
};

console.log(cleanScrapedOffer(dirtyOffer));

// --- Normalization ---

console.log(
  detectSkills(
    "Nous cherchons un dev ReactJS avec Next JS, TypeScript, Node.js, PostgreSQL et Docker Compose."
  )
);

console.log(
  detectSkills("Nous utilisons plusieurs outils internes pour le suivi projet.")
);

console.log(detectRemote("Paris - Télétravail partiel possible"));
console.log(detectRemote("Full remote depuis la France"));
console.log(detectRemote("Lyon - présentiel uniquement"));
console.log(detectRemote("Pas de télétravail pour ce poste"));

// --- Deduplication ---

console.log(
  buildOfferDeduplicationKey({
    title: "Développeur React H/F",
    company: "ACME Corp",
    location: "Paris",
    contractType: "CDI",
    description: "React TypeScript",
    url: "https://example.com/jobs/1",
    source: "test",
    scrapedAt: new Date().toISOString(),
  })
);

console.log(
  buildOfferDeduplicationKey({
    title: "developpeur react h-f",
    company: "acme corp",
    location: "Paris",
    contractType: "CDI",
    description: "React TypeScript",
    url: "https://example.com/jobs/2",
    source: "test",
    scrapedAt: new Date().toISOString(),
  })
);

const duplicatedOffers = [
  {
    title: "Développeur React H/F",
    company: "ACME Corp",
    location: "Paris",
    contractType: "CDI",
    description: "React TypeScript",
    url: "https://example.com/jobs/1",
    source: "test",
    scrapedAt: new Date().toISOString(),
  },
  {
    title: "developpeur react h-f",
    company: "acme corp",
    location: "Paris",
    contractType: "CDI",
    description: "Même offre, URL différente",
    url: "https://example.com/jobs/2",
    source: "test",
    scrapedAt: new Date().toISOString(),
  },
];

console.log(deduplicateOffers(duplicatedOffers).length);

const deduplicationReport = deduplicateOffersWithReport(duplicatedOffers);

console.log({
  uniqueCount: deduplicationReport.uniqueOffers.length,
  duplicateCount: deduplicationReport.duplicates.length,
  duplicateReasons: deduplicationReport.duplicates.map((d) => d.reason),
});

// --- Quality ---

console.log(
  analyzeOfferQuality(
    {
      title: "",
      company: "ACME",
      location: "",
      contractType: "Inconnu",
      description: "Trop court",
      url: "",
      source: "test",
      scrapedAt: new Date().toISOString(),
    },
    []
  )
);

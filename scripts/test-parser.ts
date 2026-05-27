import { parseStaticJobOffers } from "@/lib/scraping/static-job-parser";
import { fakeJobsHtml } from "@/lib/scraping/static-job-parser.test-data";

const offers = parseStaticJobOffers(
  fakeJobsHtml,
  "https://jobradar.local"
);

console.log(offers);
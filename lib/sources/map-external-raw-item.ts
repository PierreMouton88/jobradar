import { mapIndeedApifyOffer } from "./apify/indeed/map-indeed-apify-offer";
import { mapLinkedinApifyOffer } from "./apify/linkedin/map-linkedin-apify-offer";
import type {
  ExternalJobOffer,
  ExternalMappingContext,
} from "../../types/external-job-offer";
import { indeedApifyOfferSchema } from "../../types/sources/indeed-apify";
import { linkedinApifyOfferSchema } from "../../types/sources/linkedin-apify";
import { mapMeteojobApifyOffer } from "./apify/meteojob/map-meteojob-apify-offer";
import { meteojobApifyOfferSchema } from "../../types/sources/meteojob-apify";

export type SupportedExternalSource = "indeed" | "linkedin" | "meteojob";

export type ExternalRawItemMappingResult =
  | {
      ok: true;
      index: number;
      offer: ExternalJobOffer;
    }
  | {
      ok: false;
      index: number;
      error: unknown;
    };

export function mapExternalRawItem(
  rawItem: unknown,
  index: number,
  source: SupportedExternalSource,
  context: ExternalMappingContext,
): ExternalRawItemMappingResult {
  if (source === "indeed") {
    const parsed = indeedApifyOfferSchema.safeParse(rawItem);

    if (!parsed.success) {
      return {
        ok: false,
        index,
        error: parsed.error.format(),
      };
    }

    return {
      ok: true,
      index,
      offer: mapIndeedApifyOffer(parsed.data, context),
    };
  }
  if (source === "meteojob") {
    const parsed = meteojobApifyOfferSchema.safeParse(rawItem);

    if (!parsed.success) {
      return {
        ok: false,
        index,
        error: parsed.error.format(),
      };
    }

    return {
      ok: true,
      index,
      offer: mapMeteojobApifyOffer(parsed.data, context),
    };
  }
  const parsed = linkedinApifyOfferSchema.safeParse(rawItem);

  if (!parsed.success) {
    return {
      ok: false,
      index,
      error: parsed.error.format(),
    };
  }

  return {
    ok: true,
    index,
    offer: mapLinkedinApifyOffer(parsed.data, context),
  };
}

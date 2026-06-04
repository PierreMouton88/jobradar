import type { ExternalRawItemsLoader } from "@/lib/sources/external-raw-items-loader";
import { ApifyActorRunExternalRawItemsLoader } from "@/lib/sources/apify/apify-actor-run-external-raw-items-loader";
import { ApifyDatasetExternalRawItemsLoader } from "@/lib/sources/apify/apify-dataset-external-raw-items-loader";
import { JsonFileExternalRawItemsLoader } from "@/lib/sources/json-file-external-raw-items-loader";

export type ExternalRawItemsInputKind =
  | "json"
  | "apify-dataset"
  | "apify-actor";

export type CreateExternalRawItemsLoaderOptions =
  | {
      input: "json";
      filePath: string;
    }
  | {
      input: "apify-dataset";
      datasetId: string;
      token: string;
      limit?: number;
    }
  | {
      input: "apify-actor";
      token: string;
      actorId: string;
      actorInput: Record<string, unknown>;
      limit?: number;
    };

export function createExternalRawItemsLoader(
  options: CreateExternalRawItemsLoaderOptions,
): ExternalRawItemsLoader {
  switch (options.input) {
    case "json":
      return new JsonFileExternalRawItemsLoader({
        filePath: options.filePath,
      });

    case "apify-dataset":
      return new ApifyDatasetExternalRawItemsLoader({
        datasetId: options.datasetId,
        token: options.token,
        limit: options.limit,
      });

    case "apify-actor":
      return new ApifyActorRunExternalRawItemsLoader({
        token: options.token,
        actorId: options.actorId,
        input: options.actorInput,
        limit: options.limit,
      });

    default: {
      const exhaustiveCheck: never = options;
      throw new Error(
        `Type d'entrée externe non supporté : ${JSON.stringify(exhaustiveCheck)}`,
      );
    }
  }
}
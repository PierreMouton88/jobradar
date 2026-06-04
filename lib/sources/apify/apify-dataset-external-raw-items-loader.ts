import type {
  ExternalRawItemsLoader,
  ExternalRawItemsLoadResult,
} from "@/lib/sources/external-raw-items-loader";

export type ApifyDatasetExternalRawItemsLoaderOptions = {
  datasetId: string;
  token: string;
  limit?: number;
};

export class ApifyDatasetExternalRawItemsLoader
  implements ExternalRawItemsLoader
{
  constructor(
    private readonly options: ApifyDatasetExternalRawItemsLoaderOptions,
  ) {}

  async loadItems(): Promise<ExternalRawItemsLoadResult> {
    const searchParams = new URLSearchParams();

    if (this.options.limit) {
      searchParams.set("limit", String(this.options.limit));
    }

    const url = `https://api.apify.com/v2/datasets/${this.options.datasetId}/items?${searchParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.options.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Erreur Apify dataset ${this.options.datasetId}: ${response.status} ${response.statusText}`,
      );
    }

    const parsedContent: unknown = await response.json();

    if (!Array.isArray(parsedContent)) {
      throw new Error("La réponse Apify doit contenir un tableau d'items.");
    }

    return {
      items: parsedContent,
      metadata: {
        loadedAt: new Date().toISOString(),
        sourceLabel: `apify-dataset:${this.options.datasetId}`,
        itemCount: parsedContent.length,
      },
    };
  }
}
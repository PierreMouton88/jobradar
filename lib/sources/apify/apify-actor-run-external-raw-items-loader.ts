import { ApifyClient } from "apify-client";

import type {
  ExternalRawItemsLoader,
  ExternalRawItemsLoadResult,
} from "@/lib/sources/external-raw-items-loader";

export type ApifyActorRunExternalRawItemsLoaderOptions = {
  token: string;
  actorId: string;
  input: Record<string, unknown>;
  limit?: number;
};

export class ApifyActorRunExternalRawItemsLoader
  implements ExternalRawItemsLoader
{
  constructor(
    private readonly options: ApifyActorRunExternalRawItemsLoaderOptions,
  ) {}

  async loadItems(): Promise<ExternalRawItemsLoadResult> {
    const client = new ApifyClient({
      token: this.options.token,
    });

    const run = await client.actor(this.options.actorId).call(this.options.input);

    if (!run.defaultDatasetId) {
      throw new Error(
        `Le run Apify ${run.id} n'a pas retourné de defaultDatasetId.`,
      );
    }

    const { items } = await client
      .dataset(run.defaultDatasetId)
      .listItems({
        limit: this.options.limit,
      });

    return {
      items,
      metadata: {
        loadedAt: new Date().toISOString(),
        sourceLabel: `apify-actor:${this.options.actorId}:dataset:${run.defaultDatasetId}`,
        itemCount: items.length,
      },
    };
  }
}
export type ExternalRawItemsLoadResult = {
  items: unknown[];
  metadata: {
    loadedAt: string;
    sourceLabel: string;
    itemCount: number;
  };
};

export type ExternalRawItemsLoader = {
  loadItems(): Promise<ExternalRawItemsLoadResult>;
};
import fs from "node:fs/promises";
import path from "node:path";

import type {
  ExternalRawItemsLoader,
  ExternalRawItemsLoadResult,
} from "@/lib/sources/external-raw-items-loader";

export type JsonFileExternalRawItemsLoaderOptions = {
  filePath: string;
};

export class JsonFileExternalRawItemsLoader implements ExternalRawItemsLoader {
  constructor(private readonly options: JsonFileExternalRawItemsLoaderOptions) {}

  async loadItems(): Promise<ExternalRawItemsLoadResult> {
    const resolvedPath = path.resolve(this.options.filePath);
    const fileContent = await fs.readFile(resolvedPath, "utf-8");
    const parsedContent: unknown = JSON.parse(fileContent);

    if (!Array.isArray(parsedContent)) {
      throw new Error("Le fichier JSON doit contenir un tableau d'offres.");
    }

    return {
      items: parsedContent,
      metadata: {
        loadedAt: new Date().toISOString(),
        sourceLabel: resolvedPath,
        itemCount: parsedContent.length,
      },
    };
  }
}
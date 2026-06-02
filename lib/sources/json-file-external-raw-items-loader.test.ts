import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { JsonFileExternalRawItemsLoader } from "./json-file-external-raw-items-loader";

describe("JsonFileExternalRawItemsLoader", () => {
  it("loads raw items from a JSON array file", async () => {
    const tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "jobradar-json-loader-"),
    );

    const filePath = path.join(tempDir, "offers.json");

    const rawItems = [
      {
        jobKey: "indeed-1",
        title: "Développeur React",
      },
      {
        jobKey: "indeed-2",
        title: "Développeur Node.js",
      },
    ];

    await fs.writeFile(filePath, JSON.stringify(rawItems), "utf-8");

    const loader = new JsonFileExternalRawItemsLoader({
      filePath,
    });

    const result = await loader.loadItems();

    expect(result.items).toEqual(rawItems);
    expect(result.metadata.itemCount).toBe(2);
    expect(result.metadata.sourceLabel).toBe(path.resolve(filePath));
    expect(result.metadata.loadedAt).toEqual(expect.any(String));
  });

  it("throws an error when the JSON file does not contain an array", async () => {
    const tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "jobradar-json-loader-"),
    );

    const filePath = path.join(tempDir, "invalid.json");

    await fs.writeFile(
      filePath,
      JSON.stringify({
        jobKey: "indeed-1",
        title: "Développeur React",
      }),
      "utf-8",
    );

    const loader = new JsonFileExternalRawItemsLoader({
      filePath,
    });

    await expect(loader.loadItems()).rejects.toThrow(
      "Le fichier JSON doit contenir un tableau d'offres.",
    );
  });
});
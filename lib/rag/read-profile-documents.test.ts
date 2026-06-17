import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { readProfileDocuments } from "./read-profile-documents";

describe("readProfileDocuments", () => {
  it("reads markdown profile documents and maps them to RAG documents", async () => {
    const tempDirectory = await mkdtemp(
      path.join(os.tmpdir(), "jobradar-profile-documents-"),
    );

    try {
      await writeFile(
        path.join(tempDirectory, "pierre-profile-lore.md"),
        "# Profil long — Pierre\n\nContenu du profil long.",
        "utf-8",
      );

      const documents = await readProfileDocuments({
        profileDirectoryPath: tempDirectory,
      });

      expect(documents).toHaveLength(1);
      expect(documents[0]).toEqual({
        sourceType: "profile_document",
        sourceId: "profile-document:pierre-profile-lore",
        title: "Profil long — Pierre",
        content: "# Profil long — Pierre\n\nContenu du profil long.",
        metadata: {
          fileName: "pierre-profile-lore.md",
          relativePath: path.join("data", "profile", "pierre-profile-lore.md"),
        },
      });
    } finally {
      await rm(tempDirectory, { recursive: true, force: true });
    }
  });

  it("ignores non-markdown files", async () => {
    const tempDirectory = await mkdtemp(
      path.join(os.tmpdir(), "jobradar-profile-documents-"),
    );

    try {
      await writeFile(
        path.join(tempDirectory, "cv-pierre.md"),
        "# CV Pierre\n\nContenu du CV.",
        "utf-8",
      );

      await writeFile(
        path.join(tempDirectory, "notes.txt"),
        "Ce fichier ne doit pas être indexé.",
        "utf-8",
      );

      const documents = await readProfileDocuments({
        profileDirectoryPath: tempDirectory,
      });

      expect(documents).toHaveLength(1);
      expect(documents[0]?.sourceId).toBe("profile-document:cv-pierre");
    } finally {
      await rm(tempDirectory, { recursive: true, force: true });
    }
  });

  it("throws when a markdown profile document is empty", async () => {
    const tempDirectory = await mkdtemp(
      path.join(os.tmpdir(), "jobradar-profile-documents-"),
    );

    try {
      await writeFile(path.join(tempDirectory, "empty.md"), "   ", "utf-8");

      await expect(
        readProfileDocuments({
          profileDirectoryPath: tempDirectory,
        }),
      ).rejects.toThrow("Profile document is empty: empty.md");
    } finally {
      await rm(tempDirectory, { recursive: true, force: true });
    }
  });
});
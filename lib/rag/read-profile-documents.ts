import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const PROFILE_DOCUMENT_SOURCE_TYPE = "profile_document" as const;

export type ProfileRagDocument = {
  sourceType: typeof PROFILE_DOCUMENT_SOURCE_TYPE;
  sourceId: string;
  title: string;
  content: string;
  metadata: {
    fileName: string;
    relativePath: string;
  };
};

export type ReadProfileDocumentsOptions = {
  profileDirectoryPath?: string;
};

function slugifyFileName(fileName: string): string {
  return fileName
    .replace(/\.md$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractMarkdownTitle(content: string, fileName: string): string {
  const firstHeading = content
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("# "));

  if (firstHeading) {
    return firstHeading.replace(/^#\s+/, "").trim();
  }

  return fileName.replace(/\.md$/i, "");
}

export async function readProfileDocuments(
  options: ReadProfileDocumentsOptions = {},
): Promise<ProfileRagDocument[]> {
  const profileDirectoryPath =
    options.profileDirectoryPath ?? path.join(process.cwd(), "data", "profile");

  const fileNames = await readdir(profileDirectoryPath);

  const markdownFileNames = fileNames
    .filter((fileName) => fileName.toLowerCase().endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));

  const documents = await Promise.all(
    markdownFileNames.map(async (fileName) => {
      const absolutePath = path.join(profileDirectoryPath, fileName);
      const rawContent = await readFile(absolutePath, "utf-8");
      const content = rawContent.trim();

      if (!content) {
        throw new Error(`Profile document is empty: ${fileName}`);
      }

      const slug = slugifyFileName(fileName);

      return {
        sourceType: PROFILE_DOCUMENT_SOURCE_TYPE,
        sourceId: `profile-document:${slug}`,
        title: extractMarkdownTitle(content, fileName),
        content,
        metadata: {
          fileName,
          relativePath: path.join("data", "profile", fileName),
        },
      };
    }),
  );

  return documents;
}
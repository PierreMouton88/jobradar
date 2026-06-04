export type SupportedApifyActorSource = "indeed" | "linkedin";

export type ApifyActorInputPreset = {
  source: SupportedApifyActorSource;
  actorId: string;
  input: Record<string, unknown>;
};

export const apifyActorInputPresets = {
  "indeed-nancy-dev": {
    source: "indeed",
    actorId: "MXLpngmVpE8WTESQr",
    input: {
      country: "fr",
      enableUniqueJobs: true,
      fromDays: "14",
      includeSimilarJobs: true,
      location: "Nancy",
      maxRows: 20,
      maxRowsPerUrl: 20,
      query: "Développeur ",
      radius: "100",
      sort: "date",
      urls: [
        "https://fr.indeed.com/jobs?q=developpeur+web&l=nancy+%2854%29&fromage=14&radius=100&from=searchOnDesktopSerp&vjk=6093f05ed0227ebf",
      ],
    },
  },

  "linkedin-grand-est-dev": {
    source: "linkedin",
    actorId: "worldunboxer/rapid-linkedin-scraper",
    input: {
      easy_apply: false,
      job_title: "Développeur",
      jobs_entries: 25,
      location: "Grand Est",
      start_jobs: 25,
    },
  },
} satisfies Record<string, ApifyActorInputPreset>;

export type ApifyActorInputPresetName = keyof typeof apifyActorInputPresets;

export function getApifyActorInputPreset(
  presetName: string,
): ApifyActorInputPreset {
  const preset =
    apifyActorInputPresets[presetName as ApifyActorInputPresetName];

  if (!preset) {
    throw new Error(`Preset Apify inconnu : ${presetName}`);
  }

  return preset;
}
"use server";

import { revalidatePath } from "next/cache";

import { analyzeAndSaveJobOffer } from "@/lib/ai/analyze-and-save-job-offer";

export async function analyzeOfferAction(jobOfferId: string) {
  await analyzeAndSaveJobOffer(jobOfferId);

  revalidatePath(`/offers/${jobOfferId}`);
}
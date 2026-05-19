import { prisma } from "@/lib/prisma";
import { analyzeJobOffer } from "./analyze-job-offer";

export async function analyzeAndSaveJobOffer(jobOfferId: string) {
  const offer = await prisma.jobOffer.findUnique({
    where: {
      id: jobOfferId,
    },
  });

  if (!offer) {
    throw new Error(`JobOffer not found: ${jobOfferId}`);
  }

  const result = await analyzeJobOffer({
    title: offer.title,
    company: offer.company,
    location: offer.location,
    description: offer.description,
    skills: offer.skills,
  });

  const { analysis, metadata } = result;

  const savedAnalysis = await prisma.jobAnalysis.upsert({
    where: {
      jobOfferId: offer.id,
    },
    update: {
      summary: analysis.summary,
      requiredSkills: analysis.requiredSkills,
      niceToHaveSkills: analysis.niceToHaveSkills,
      experienceLevel: analysis.experienceLevel,
      remotePolicy: analysis.remotePolicy,
      salaryMentioned: analysis.salaryMentioned,
      redFlags: analysis.redFlags,
      positiveSignals: analysis.positiveSignals,
      analysisMode: metadata.analysisMode,
      modelName: metadata.modelName,
      inputTokens: metadata.inputTokens,
      outputTokens: metadata.outputTokens,
      totalTokens: metadata.totalTokens,
    },
    create: {
      jobOfferId: offer.id,
      summary: analysis.summary,
      requiredSkills: analysis.requiredSkills,
      niceToHaveSkills: analysis.niceToHaveSkills,
      experienceLevel: analysis.experienceLevel,
      remotePolicy: analysis.remotePolicy,
      salaryMentioned: analysis.salaryMentioned,
      redFlags: analysis.redFlags,
      positiveSignals: analysis.positiveSignals,
      analysisMode: metadata.analysisMode,
      modelName: metadata.modelName,
      inputTokens: metadata.inputTokens,
      outputTokens: metadata.outputTokens,
      totalTokens: metadata.totalTokens,
    },
  });

  return savedAnalysis;
}

import { candidateProfile } from "@/lib/profile/candidate-profile";
import { scoreJobOffer } from "@/lib/scoring/score-job-offer";

const fakeOffer = {
  skills: ["React", "TypeScript", "Next.js", "Docker", "Python"],
  contractType: "CDI" as const,
  location: "Nancy - Hybride",
  qualityScore: 90,
  analysis: {
    experienceLevel: "junior" as const,
    remotePolicy: "hybrid" as const,
    salaryMentioned: true,
    redFlags: ["rythme soutenu", "autonomie rapide"],
    positiveSignals: [
      "accompagnement senior",
      "code review",
      "missions progressives",
    ],
  },
};

const result = scoreJobOffer(fakeOffer, candidateProfile);

console.log("Score de compatibilité :");
console.log(`${result.score}/${result.maxScore}`);
console.log(`${result.percentage}%`);

console.log("\nPoints positifs :");
for (const explanation of result.positiveExplanations) {
  console.log(`+ ${explanation.label} (${explanation.points} points)`);
}

console.log("\nPoints neutres / négatifs :");
for (const explanation of result.negativeExplanations) {
  console.log(`- ${explanation.label} (${explanation.points} points)`);
}

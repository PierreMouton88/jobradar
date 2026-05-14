"use client";

import { useEffect, useState } from "react";

type FakeDynamicJob = {
  title: string;
  company: string;
  location: string;
  contractType: string;
  description: string;
  url: string;
};

const firstJobs: FakeDynamicJob[] = [
  {
    title: "Développeur React Junior",
    company: "NovaTech",
    location: "Nancy",
    contractType: "CDI",
    description: "Poste frontend avec React, TypeScript et CSS.",
    url: "https://fake-jobs.local/offers/react-junior",
  },
  {
    title: "Développeur Fullstack TypeScript",
    company: "DataCraft",
    location: "Remote",
    contractType: "Alternance",
    description: "Stack Next.js, Node.js, PostgreSQL et Docker.",
    url: "https://fake-jobs.local/offers/fullstack-ts",
  },
];

const moreJobs: FakeDynamicJob[] = [
  {
    title: "Intégrateur Frontend",
    company: "PixelWorks",
    location: "Metz",
    contractType: "CDD",
    description: "Intégration HTML, CSS, Tailwind et JavaScript.",
    url: "https://fake-jobs.local/offers/frontend-integrator",
  },
];

export default function FakeDynamicJobsPage() {
  const [jobs, setJobs] = useState<FakeDynamicJob[]>([]);
  const [hasLoadedMore, setHasLoadedMore] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setJobs(firstJobs);
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, []);

  function handleLoadMore() {
    setJobs((currentJobs) => [...currentJobs, ...moreJobs]);
    setHasLoadedMore(true);
  }

  return (
    <main>
      <h1>Fake Dynamic Jobs</h1>

      {jobs.length === 0 ? (
        <p data-testid="loading-message">Chargement des offres...</p>
      ) : (
        <section data-testid="jobs-list">
          {jobs.map((job) => (
            <article key={job.url} className="job-card">
              <h2 className="job-title">{job.title}</h2>
              <p className="job-company">{job.company}</p>
              <p className="job-location">{job.location}</p>
              <p className="job-contract">{job.contractType}</p>
              <p className="job-description">{job.description}</p>
              <a className="job-url" href={job.url}>
                Voir l'offre
              </a>
            </article>
          ))}
        </section>
      )}

      {jobs.length > 0 && !hasLoadedMore && (
        <button type="button" onClick={handleLoadMore}>
          Voir plus
        </button>
      )}
    </main>
  );
}
# JobRadar IA

JobRadar IA est un projet pédagogique et portfolio autour de la veille d’offres d’emploi, du scraping/import de données, de PostgreSQL, du scoring, du RAG et de l’intelligence artificielle appliquée au développement web.

L’objectif est de construire progressivement une application capable de :

- récupérer ou importer des offres depuis des sources contrôlées, des exports externes et des actors Apify ;
- nettoyer, normaliser et dédupliquer les données ;
- stocker les offres dans PostgreSQL avec Prisma ;
- analyser les offres avec un LLM en sorties structurées validées avec Zod ;
- comparer les offres à un profil candidat ;
- prioriser les offres selon leur intérêt réel ;
- analyser avec IA seulement les offres candidates, avec limite, dry-run et flag explicite ;
- interroger les offres, le profil candidat et les documents profil/CV avec du RAG ;
- utiliser un agent avec tools contrôlés ;
- générer un rapport Markdown de veille ;
- générer des inputs Apify dynamiques depuis les scénarios de recherche ;
- piloter des campagnes d’import Apify depuis l’interface `/imports` avec sélection des sources, localisations et localisations custom ;
- préfiltrer les imports Apify selon la pertinence profil avant insertion en base ;
- nettoyer ponctuellement la base des offres peu pertinentes importées lors de tests ;
- afficher un rapport de campagne d’import directement dans l’UI ;
- afficher dans `/offers` un scoring et une priorité plus explicables, avec points positifs et points de vigilance.

Le projet avance module par module afin de rester compréhensible, maintenable et explicable en entretien.

---

## Vision actuelle

La V1 de JobRadar IA est terminée. Elle a construit une base pédagogique complète.

La V2 est en cours. Elle transforme progressivement cette base en outil personnel de veille automatisée d’offres d’emploi.

Vision V2 :

```txt
sources réalistes / exports externes / actors Apify
→ connecteurs et mappers
→ format pivot externe
→ nettoyage / normalisation / déduplication
→ préfiltre de pertinence profil avant import
→ import PostgreSQL des offres retenues
→ nettoyage ponctuel des offres peu pertinentes déjà importées
→ navigation UI sur volume réel
→ scoring profil tolérant aux données incomplètes
→ priorisation heuristique explicable
→ rapport Markdown de veille
→ profils candidat + scénarios de recherche
→ analyse IA contrôlée par limite et budget
→ RAG générique profil + documents profil/CV + offres
→ inputs Apify dynamiques depuis SearchScenario
→ runs Apify contrôlés depuis CLI
→ campagnes d’import Apify pilotées depuis l’interface `/imports`
→ rapport de campagne affiché dans l’UI
→ filtrage et tri des offres par priorité dans `/offers`
→ distribution éventuelle du rapport
```

---

## État actuel du projet

Le projet couvre actuellement :

- Next.js App Router ;
- scraping statique avec Cheerio ;
- scraping dynamique avec Playwright ;
- PostgreSQL + Prisma ;
- nettoyage, normalisation, déduplication et qualité des données ;
- analyse LLM structurée avec Zod ;
- scoring par rapport au profil candidat ;
- RAG avec embeddings OpenAI et pgvector ;
- RAG générique profil-aware basé sur `RagDocumentEmbedding` ;
- documents profil/CV Markdown indexés dans le RAG avec `sourceType = profile_document` ;
- agent avec tools contrôlés ;
- import externe depuis JSON / dataset / actors Apify ;
- génération dynamique d’inputs Apify depuis `SearchScenario` ;
- adapters Apify pour Indeed, LinkedIn et Meteojob ;
- mappers source-specific Indeed, LinkedIn et Meteojob ;
- page `/imports` de pilotage des campagnes Apify ;
- lancement réel d’une campagne d’import depuis l’UI avec confirmation ;
- sélection des sources et localisations à lancer ;
- ajout de localisations custom depuis l’UI ;
- rapport de campagne d’import affiché dans l’interface ;
- préfiltre de pertinence profil avant import PostgreSQL ;
- rapport UI des offres acceptées et rejetées par le préfiltre ;
- script de nettoyage des offres peu pertinentes déjà présentes en base ;
- format pivot `ExternalJobOffer` ;
- interface `/offers` adaptée à un vrai volume d’offres ;
- pagination serveur, filtres, tri et responsive mobile-first ;
- affichage du score, de la priorité, de l’état d’analyse IA et des raisons de scoring dans les cartes d’offres ;
- filtres rapides par priorité et tri par priorité puis score ;
- rapport Markdown local de veille ;
- profils candidat et scénarios de recherche stockés en base ;
- scoring profil final plus tolérant aux informations manquantes, au senior et aux localisations hors préférences ;
- priorisation heuristique des offres avec file de priorité ;
- analyse IA contrôlée par CLI avec `--dry-run`, `--limit` et `--run` ;
- tests unitaires avec Vitest ;
- lint, build et script global de vérification.

---

## Pipeline fonctionnel actuel

```txt
sources fictives / pages contrôlées
ou exports JSON / datasets / actors Apify
ou inputs Apify générés depuis le scénario actif
ou campagne Apify lancée depuis `/imports`
↓
mappers source-specific ou mapping externe
↓
ExternalJobOffer
↓
préparation / nettoyage / normalisation
↓
déduplication
↓
préfiltre profil de pertinence pour les imports Apify
↓
import PostgreSQL avec upsert par URL normalisée des offres retenues
↓
ScrapingRun
↓
affichage Next.js
↓
scoring profil tolérant aux données incomplètes
↓
priorisation heuristique explicable
↓
sélection des candidates IA
↓
dry-run / estimation indicative / limite max
↓
analyse IA contrôlée avec --run explicite
↓
stockage JobAnalysis
↓
rapport Markdown de veille
↓
indexation RAG générique du profil, des documents profil/CV et des offres
↓
questions RAG profil-aware depuis /rag
```

---

## Objectif pédagogique

Ce projet sert d’abord à apprendre.

L’objectif n’est pas seulement d’obtenir une application fonctionnelle, mais de comprendre :

- comment structurer une application Next.js avec App Router ;
- comment extraire des données depuis du HTML ;
- pourquoi Cheerio ne suffit pas pour les pages dynamiques ;
- comment Playwright permet d’automatiser un navigateur ;
- pourquoi passer de fichiers JSON à PostgreSQL ;
- comment utiliser Prisma pour gérer les migrations et les relations ;
- comment nettoyer et normaliser des données avant de les exploiter ;
- comment éviter les doublons ;
- comment utiliser un LLM pour produire une analyse structurée ;
- pourquoi valider les sorties IA avec Zod ;
- comment tracer les tokens et les coûts d’une analyse IA ;
- comment importer des données externes hétérogènes ;
- comment intégrer Apify sans en faire une boîte noire incontrôlée ;
- comment transformer un scénario de recherche métier en input technique propre à chaque actor ;
- pourquoi isoler les différences de formats dans des adapters et des mappers ;
- comment réduire le bruit des imports avec un préfiltre déterministe avant écriture en base ;
- comment construire un rapport opérationnel de veille ;
- comment rendre un scoring plus tolérant aux données manquantes sans perdre l’explicabilité ;
- comment ajouter des garde-fous autour des appels IA ;
- comment fonctionne un RAG avec embeddings, pgvector, contexte et sources ;
- comment faire évoluer un RAG centré offres vers un index documentaire générique ;
- comment ajouter des documents Markdown de profil/CV dans un RAG existant ;
- comment améliorer le retrieval avec une requête enrichie par le profil candidat ;
- comment préparer un projet explicable en entretien.

---

## Stack technique

### Frontend / fullstack

- Next.js avec App Router
- React
- TypeScript
- Tailwind CSS
- Server Components
- Server Actions

### Scraping / sources

- Cheerio pour le scraping statique
- Playwright pour le scraping dynamique
- Exports JSON externes
- Datasets Apify
- Actors Apify contrôlés
- Adapters Apify dynamiques depuis les scénarios de recherche

### Base de données

- PostgreSQL
- Prisma ORM
- Docker Compose pour lancer PostgreSQL en local
- pgvector pour le RAG

### IA

- Vercel AI SDK
- OpenAI API
- Zod
- Structured outputs
- Embeddings OpenAI
- RAG avec pgvector
- RAG profil-aware avec index documentaire générique
- Documents profil/CV Markdown dans le RAG
- Tool calling
- Agent avec tools contrôlés
- Mode fake IA avec `USE_FAKE_AI`
- CLI d’analyse IA contrôlée avec limite et dry-run

### Qualité / tests

- Vitest
- TypeScript
- ESLint
- Script global `npm run check`
- Scripts de nettoyage contrôlés avec dry-run par défaut

---

## Architecture simplifiée

```txt
jobradar-ia/
├─ app/
│  ├─ offers/
│  │  ├─ page.tsx
│  │  └─ [id]/
│  │     ├─ page.tsx
│  │     ├─ actions.ts
│  │     └─ AnalyzeSubmitButton.tsx
│  ├─ scraping-runs/
│  │  └─ page.tsx
│  ├─ data-quality/
│  │  └─ page.tsx
│  ├─ profile/
│  │  └─ page.tsx
│  ├─ rag/
│  │  ├─ actions.ts
│  │  └─ page.tsx
│  ├─ imports/
│  │  ├─ actions.ts
│  │  ├─ ImportCampaignButton.tsx
│  │  └─ page.tsx
│  └─ agent/
│     └─ page.tsx
│
├─ components/
│  ├─ layout/
│  │  └─ Nav.tsx
│  ├─ offers/
│  │  ├─ OfferCard.tsx
│  │  ├─ OfferList.tsx
│  │  └─ OfferFilters.tsx
│  └─ rag/
│     └─ RagQuestionForm.tsx
│
├─ lib/
│  ├─ ai/
│  │  ├─ analyze-job-offer.ts
│  │  ├─ analyze-and-save-job-offer.ts
│  │  ├─ estimate-ai-cost.ts
│  │  ├─ get-ai-analysis-candidates.ts
│  │  ├─ select-ai-analysis-candidates.ts
│  │  └─ job-analysis-schema.ts
│  ├─ agent/
│  ├─ cli/
│  │  └─ read-cli-question.ts
│  ├─ imports/
│  │  └─ external-offer-relevance-filter.ts
│  ├─ offers/
│  ├─ profile/
│  ├─ rag/
│  │  ├─ answer-question-with-profile-aware-rag.ts
│  │  ├─ answer-question-with-rag-documents.ts
│  │  ├─ build-profile-aware-rag-query.ts
│  │  ├─ candidate-profile-rag-document.ts
│  │  ├─ create-rag-document-embedding.ts
│  │  ├─ generate-embedding.ts
│  │  ├─ get-rag-index-stats.ts
│  │  ├─ job-offer-rag-document.ts
│  │  ├─ map-active-search-context-to-candidate-profile-rag-input.ts
│  │  ├─ read-profile-documents.ts
│  │  └─ search-rag-documents.ts
│  ├─ scoring/
│  │  ├─ score-job-offer.ts
│  │  ├─ prioritize-job-offer.ts
│  │  └─ map-db-offer-to-scorable-offer.ts
│  ├─ scraping/
│  ├─ search/
│  │  └─ job-search-criteria.ts
│  ├─ search-context/
│  ├─ sources/
│  │  ├─ apify/
│  │  │  ├─ apify-actor-adapter.ts
│  │  │  ├─ apify-actor-adapters.ts
│  │  │  ├─ apify-actor-run-plan.ts
│  │  │  ├─ indeed/
│  │  │  ├─ linkedin/
│  │  │  └─ meteojob/
│  │  └─ map-external-raw-item.ts
│  └─ prisma.ts
│
├─ scripts/
│  ├─ import-scraped-jobs.ts
│  ├─ preview-external-import.ts
│  ├─ import-external-offers.ts
│  ├─ preview-apify-actor-inputs.ts
│  ├─ generate-jobradar-report.ts
│  ├─ analyze-ai-candidates.ts
│  ├─ preview-candidate-profile-rag-document.ts
│  ├─ index-candidate-profile-rag-document.ts
│  ├─ preview-profile-documents.ts
│  ├─ index-profile-documents.ts
│  ├─ index-job-offers-rag-documents.ts
│  ├─ cleanup-irrelevant-job-offers.ts
│  ├─ check-rag-document-embeddings.ts
│  ├─ test-rag-document-search.ts
│  ├─ test-rag-document-answer.ts
│  └─ ...
│
├─ data/
│  ├─ scraped-jobs.json
│  ├─ dynamic-scraped-jobs.json
│  ├─ external/
│  └─ profile/
│     ├─ pierre-profile-lore.md
│     └─ cv-pierre.md
│
├─ reports/
│  └─ jobradar-report-YYYY-MM-DD.md
│
├─ types/
│  ├─ external-job-offer.ts
│  └─ sources/
│     ├─ indeed-apify.ts
│     ├─ linkedin-apify.ts
│     └─ meteojob-apify.ts
│
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
│
├─ docker-compose.yml
├─ prisma.config.ts
├─ .env.example
└─ README.md
```

---

## Modules réalisés

### Module 1 — Next.js minimum viable

Statut : terminé.

Objectif : créer une application Next.js simple affichant des offres fictives.

Routes principales :

- `/offers`
- `/offers/[id]`

Composants principaux :

- `components/offers/OfferCard.tsx`
- `components/offers/OfferList.tsx`
- `components/offers/OfferFilters.tsx`

Les pages ne lisent pas directement la base ou les JSON. Elles passent par une couche dédiée dans `lib/offers/get-offers.ts`.

---

### Module 2 — Scraping statique avec Cheerio

Statut : terminé.

Objectif :

```txt
HTML local contrôlé
→ parsing Cheerio
→ extraction d’offres
→ export JSON
```

Fichiers principaux :

- `lib/scraping/static-job-parser.ts`
- `lib/scraping/static-job-parser.test-data.ts`
- `lib/scraping/export-static-jobs.ts`

Commande :

```bash
npm run scrape:static
```

---

### Module 3 — Scraping dynamique avec Playwright

Statut : terminé.

Objectif :

```txt
page dynamique locale
→ ouverture avec Playwright
→ attente du rendu JavaScript
→ clic sur “Voir plus”
→ extraction des offres
→ export JSON
```

Route locale de test :

- `/fake-dynamic-jobs`

Commande :

```bash
npm run scrape:dynamic
```

---

### Module 4 — PostgreSQL + Prisma

Statut : terminé.

Objectif :

```txt
JSON temporaires
→ import en base PostgreSQL
→ lecture avec Prisma
→ affichage dans Next.js
```

Le champ `url` de `JobOffer` est unique. Les imports utilisent `upsert` pour créer ou mettre à jour les offres.

---

### Module 5 — Nettoyage, normalisation, déduplication et qualité

Statut : terminé.

Fonctionnalités ajoutées :

- nettoyage des chaînes ;
- normalisation des URLs ;
- suppression des paramètres UTM ;
- détection du télétravail ;
- détection des compétences techniques ;
- déduplication par URL normalisée ;
- déduplication par clé métier ;
- rapport de déduplication ;
- analyse qualité ;
- stockage `qualityScore` et `qualityIssues` ;
- page `/data-quality`.

---

### Module 6 — LLM structured extraction

Statut : terminé.

Objectif :

```txt
description d’offre
→ LLM
→ objet structuré
→ validation Zod
→ stockage PostgreSQL
→ affichage dans la page détail
```

L’analyse IA est déclenchée manuellement depuis `/offers/[id]`.

Données extraites :

- `summary`
- `requiredSkills`
- `niceToHaveSkills`
- `experienceLevel`
- `remotePolicy`
- `salaryMentioned`
- `redFlags`
- `positiveSignals`

Le projet prévoit un fake mode :

```env
USE_FAKE_AI=true
```

---

### Module 7 — Scoring par rapport au profil

Statut : terminé.

Objectif : comparer les offres au profil candidat.

Le scoring prend en compte notamment :

- compétences fortes ;
- compétences en apprentissage ;
- contrat ;
- localisation ;
- télétravail ;
- niveau d’expérience ;
- red flags ;
- signaux positifs ;
- exigences explicites de diplôme ;
- qualité des données.

Le score est utilisé dans l’interface et dans le rapport Markdown. Il a été rendu plus tolérant au module 21 afin de ne pas pénaliser trop fortement les offres techniques incomplètes, senior ou non encore analysées par IA.

---

### Module 8 — RAG sur les offres

Statut : terminé en V1.

Objectif : poser des questions en langage naturel sur les offres stockées.

Le module a introduit :

- embeddings OpenAI ;
- pgvector ;
- table spécialisée `JobOfferEmbedding` ;
- recherche vectorielle ;
- topK ;
- contexte injecté ;
- réponse avec sources d’offres.

Note : ce RAG V1 centré offres a ensuite été généralisé au module 17 avec `RagDocumentEmbedding`.

---

### Module 9 — Agent avec tools contrôlés

Statut : terminé en V1.

Objectif : créer un agent capable d’utiliser des tools limités.

Garde-fous :

- tools de lecture uniquement au départ ;
- inputs validés avec Zod ;
- nombre d’étapes limité ;
- logs des tools utilisés ;
- aucune action sensible sans validation humaine.

---

### Module 10 — Qualité, sécurité, README et portfolio

Statut : première base terminée, polish continu.

Objectif : rendre le projet présentable et défendable.

Éléments couverts :

- README ;
- sécurité des clés ;
- `.env.example` ;
- fake modes ;
- logs ;
- tests ;
- script `npm run check`.

---

### Module 11 — V2 : imports externes, format pivot et Apify

Statut : terminé.

Objectif : importer de vraies données ou des exports externes sans lier directement chaque format brut au modèle `JobOffer`.

Pipeline V2 :

```txt
raw external item
→ mapper source-specific
→ ExternalJobOffer
→ préparation / nettoyage / déduplication
→ JobOffer DB
```

Éléments ajoutés :

- format pivot `ExternalJobOffer` ;
- champs source V2 : `sourceProvider`, `sourceName`, `sourceActor`, `sourceTags`, `rawData` ;
- mappers Indeed et LinkedIn ;
- dispatcher `mapExternalRawItem` ;
- loader JSON ;
- factory `createExternalRawItemsLoader` ;
- pipeline de preview, préparation, déduplication et import ;
- scripts `preview-external-import.ts` et `import-external-offers.ts`.

Commandes :

```bash
npm run external:preview
npm run external:import
```

Le CLI supporte notamment :

```txt
--input=json
--input=apify-dataset
--input=apify-actor
--source=indeed|linkedin|meteojob
--actor=...
--dataset-id=...
--preset=...
--dry-run
--run-actor
--limit=...
```

Garde-fou important :

```txt
--dry-run empêche l’écriture en base.
--dry-run ne bloque pas le coût Apify.
--run-actor est obligatoire pour lancer réellement un actor Apify.
```

Sources validées :

- export JSON Indeed local ;
- actor Apify Indeed ;
- actor Apify LinkedIn.

---

### Module 12 — V2 : UI offres réelles, filtres, tri et responsive

Statut : terminé.

Objectif : rendre `/offers` utilisable avec un vrai volume d’offres.

Architecture :

```txt
URL search params
→ app/offers/page.tsx
→ parsing des paramètres
→ getOffers({ page, pageSize, search, source, remote, contractType, dateRange, sort })
→ Prisma findMany + count
→ mapping DB vers type UI
→ score de compatibilité
→ OfferList
→ OfferCard
→ pagination par liens
```

Fonctionnalités ajoutées :

- pagination serveur ;
- lecture des searchParams ;
- recherche texte ;
- filtre source ;
- filtre contrat ;
- filtre remote ;
- filtre date d’import ;
- tri par date ;
- conservation des filtres dans la pagination ;
- UI adaptée au thème sombre ;
- responsive mobile-first.

Responsive :

- `components/layout/Nav.tsx` ;
- navigation sticky globale ;
- liens desktop ;
- menu hamburger mobile ;
- lien actif avec `usePathname`.

`OfferFilters` est devenu un Client Component :

- `useState` ;
- filtres repliés sur mobile ;
- ouverture automatique si filtres actifs ;
- badge du nombre de filtres actifs.

---

### Module 13 — V2 : rapport Markdown de veille

Statut : terminé.

Objectif : générer un rapport local exploitable après une campagne d’import.

Commande :

```bash
npm run report:generate
```

Fichier généré :

```txt
reports/jobradar-report-YYYY-MM-DD.md
```

Le rapport contient maintenant :

- résumé global ;
- mode rapport ;
- profil candidat et scénario de recherche actifs ;
- nombre total d’offres ;
- nombre d’offres réelles ;
- derniers imports ;
- offres récentes ;
- file de priorité issue du scoring et des heuristiques ;
- offres écartées par heuristique ;
- points de vigilance qualité ;
- liens locaux vers `/offers/[id]` ;
- URLs sources.

Le rapport exclut les sources pédagogiques :

- `static-html`
- `fake-dynamic-jobs`
- `jobradar.local`

Objectif produit du reporting :

```txt
Après une collecte d’offres, comprendre rapidement :
- ce qui a été importé ;
- quelles offres regarder ;
- quelles offres traiter en priorité ;
- quelles offres sont écartées par heuristique ;
- quelles sources ou données posent problème ;
- quelles actions faire ensuite.
```

---

### Module 14 — V2 : profils candidat et scénarios de recherche en base

Statut : terminé.

Objectif : sortir progressivement le profil candidat du hardcoding TypeScript et préparer plusieurs scénarios de recherche.

Distinction retenue :

```txt
CandidateProfile
= qui je suis professionnellement
= compétences, niveau, préférences générales, signaux positifs/négatifs

SearchScenario
= ce que je cherche dans un contexte donné
= zone géographique, type de poste, remote, contrats, mots-clés, sources
```

Éléments ajoutés :

- modèles Prisma `CandidateProfile` et `SearchScenario` ;
- seed du profil par défaut `Pierre — Fullstack JS/TS junior` ;
- seed du scénario par défaut `Grand Est — Fullstack / Backend JS` ;
- helpers `getDefaultCandidateProfile()`, `getDefaultSearchScenario()`, `getActiveSearchContext()` ;
- mapper `mapCandidateProfileToScoringProfile()` ;
- script de test du contexte actif ;
- branchement du rapport Markdown sur le profil et le scénario actifs en base ;
- scoring du rapport alimenté par le profil BDD.

Point technique corrigé pendant le module :

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Cette instruction a été ajoutée à l’ancienne migration pgvector afin d’éviter l’erreur Prisma sur la shadow database :

```txt
ERROR: type "vector" does not exist
```

L’ancien fichier `lib/profile/candidate-profile.ts` peut encore exister pour fournir le type TypeScript utilisé par le scoring, mais la source de vérité du rapport est maintenant la base.

---

### Module 15 — V2 : priorisation heuristique des offres

Statut : terminé.

Objectif : créer une couche de décision au-dessus du score de compatibilité.

Le scoring répond à :

```txt
À quel point cette offre correspond au profil ?
```

La priorisation répond à :

```txt
Qu’est-ce que je fais avec cette offre ?
```

Éléments ajoutés :

- `lib/scoring/prioritize-job-offer.ts` ;
- types `OfferPriorityLevel`, `PriorityReason`, `PrioritizedOffer` ;
- fonction pure `prioritizeJobOffer(...)` ;
- tests unitaires Vitest ;
- intégration dans `getOffers` pour enrichir les offres UI avec `priority` ;
- ajout de `priority` dans le type `JobOffer` côté UI ;
- intégration dans le rapport Markdown ;
- remplacement des sections redondantes du rapport par une vraie file de priorité ;
- section courte d’audit des offres écartées par heuristique.

Niveaux de priorité :

```txt
very_promising
interesting
needs_ai_analysis
watch
low_priority
probably_ignore
```

La priorisation prend notamment en compte :

- le score de compatibilité ;
- la présence ou non d’une analyse IA ;
- le niveau d’expérience détecté ;
- les red flags IA ;
- la qualité des données ;
- les titres manifestement hors cible développeur.

Le rapport Markdown contient désormais notamment :

```txt
## File de priorité
## Offres écartées par heuristique
## Points de vigilance qualité
```

Cette étape a préparé le module 16 : analyser avec IA uniquement les offres candidates, au lieu de consommer l’API sur tout le volume.

---

### Module 16 — V2 : analyse IA contrôlée par budget et limite

Statut : terminé.

Objectif : analyser seulement les offres prioritaires et non encore analysées, avec des garde-fous stricts contre les appels IA massifs ou involontaires.

Pipeline réalisé :

```txt
offres en base
→ mapping DB vers offre compatible scoring
→ scoreJobOffer()
→ prioritizeJobOffer()
→ sélection des candidates IA
→ dry-run par défaut
→ estimation indicative de tokens
→ limite max par run
→ flag explicite --run
→ analyzeAndSaveJobOffer()
→ stockage JobAnalysis
→ rapport Markdown mis à jour
```

Éléments ajoutés ou modifiés :

- `lib/ai/select-ai-analysis-candidates.ts` ;
- `lib/ai/select-ai-analysis-candidates.test.ts` ;
- `lib/ai/get-ai-analysis-candidates.ts` ;
- `lib/scoring/map-db-offer-to-scorable-offer.ts` ;
- `scripts/analyze-ai-candidates.ts` ;
- script npm `ai:analyze-candidates`.

La commande de sélection/analyse est :

```bash
npm run ai:analyze-candidates -- --limit=5 --dry-run
npm run ai:analyze-candidates -- --limit=5 --run
```

Comportement :

- `--dry-run` affiche les offres qui seraient analysées sans appel IA ;
- en absence de `--run`, le dry-run reste le comportement par défaut ;
- `--run` est obligatoire pour lancer de vrais appels IA ;
- `--limit` limite le nombre maximal d’offres analysées ;
- les offres déjà analysées sont ignorées ;
- les offres `low_priority` et `probably_ignore` sont ignorées ;
- les offres candidates sont triées par priorité puis par score ;
- l’analyse réelle réutilise `analyzeAndSaveJobOffer()` ;
- le fake mode `USE_FAKE_AI=true` reste respecté par la logique existante ;
- les résultats sont stockés dans `JobAnalysis` ;
- le rapport Markdown reflète ensuite les analyses stockées.

Validation réalisée :

```txt
Dry-run initial
→ 2 candidates détectées

Run réel contrôlé avec --limit=2 --run
→ 2 analyses OpenAI lancées
→ JobAnalysis sauvegardées
→ tokens affichés

Dry-run suivant
→ 0 candidate
→ les offres déjà analysées ne sont plus proposées

Rapport Markdown suivant
→ les offres analysées ne restent plus dans needs_ai_analysis
→ elles passent dans la file de priorité selon le score recalculé
```

Garde-fous importants :

- pas d’analyse IA automatique sur toutes les offres ;
- pas d’appel IA sans `--run` explicite ;
- limite obligatoire par run ;
- exclusion des offres déjà analysées ;
- estimation indicative avant exécution ;
- clés OpenAI toujours côté serveur/scripts ;
- aucune action de candidature ou d’envoi automatisé.

---

### Module 17 — V2 : RAG profil/offres avec index documentaire générique

Statut : terminé.

Objectif : faire évoluer le RAG V1, centré sur les offres, vers un RAG plus personnalisé qui utilise à la fois le profil candidat actif et les offres indexées.

Avant le module 17 :

```txt
JobOffer
→ buildJobOfferRagDocument()
→ JobOfferEmbedding
→ recherche vectorielle sur les offres
→ réponse RAG avec sources d’offres
```

Après le module 17 :

```txt
CandidateProfile + SearchScenario
→ document RAG de profil
→ RagDocumentEmbedding(sourceType = candidate_profile)

JobOffer
→ document RAG d’offre
→ RagDocumentEmbedding(sourceType = job_offer)

question utilisateur
→ requête enrichie avec le profil actif
→ recherche vectorielle générique
→ réponse LLM avec sources mixtes
→ UI /rag
```

Éléments ajoutés :

- modèle Prisma `RagDocumentEmbedding` ;
- index documentaire générique basé sur `sourceType`, `sourceId`, `title`, `content`, `metadata`, `embedding` ;
- document RAG du profil candidat actif ;
- mapping `CandidateProfile + SearchScenario → CandidateProfileRagInput` ;
- fonction générique `createRagDocumentEmbedding()` ;
- recherche vectorielle générique `searchRagDocuments()` ;
- réponse RAG générique `answerQuestionWithRagDocuments()` ;
- requête enrichie profil-aware avec `buildProfileAwareRagQuery()` ;
- orchestration `answerQuestionWithProfileAwareRag()` ;
- scripts d’indexation et de test RAG générique ;
- adaptation de `/rag` aux sources génériques.

Scripts RAG ajoutés ou utilisés :

```bash
npm run rag:preview-profile-document
npm run rag:index-profile-document
npm run rag:index-job-offer-documents
npm run rag:check-documents
npm run rag:search-documents
npm run rag:answer-documents
```

Le nouvel index peut contenir plusieurs types de documents :

```txt
candidate_profile
job_offer
profile_document
```

La page `/rag` utilise maintenant le nouveau RAG profil-aware :

```txt
question utilisateur
→ récupération du profil actif
→ enrichissement de la requête avec les compétences, rôles ciblés, lieux et points de vigilance
→ recherche dans RagDocumentEmbedding
→ réponse LLM à partir des documents récupérés
→ affichage des sources génériques
```

Pourquoi la requête enrichie est utile : une question vague comme “quelles offres sont cohérentes avec ma recherche ?” ne contient pas forcément les mots-clés React, TypeScript, junior ou Grand Est. Le module 17 enrichit donc la requête de retrieval avec le profil actif, tout en gardant la question originale pour la réponse LLM.

Décision importante : l’ancien index `JobOfferEmbedding` peut encore exister pour compatibilité historique, mais l’interface `/rag` s’appuie maintenant sur l’index générique `RagDocumentEmbedding`.

Limite volontaire à la fin du module 17 : le module 17 indexait le profil structuré et les offres. Les documents longs de profil, le “lore” candidat et le CV Markdown ont ensuite été ajoutés dans le module 18 pour garder un périmètre clair par module.

---

### Module 18 — V2 : documents profil/CV dans le RAG

Statut : terminé.

Objectif : enrichir le nouvel index RAG générique avec des documents personnels plus longs que le profil structuré.

Avant le module 18 :

```txt
CandidateProfile + SearchScenario
→ document RAG de profil structuré
→ RagDocumentEmbedding(sourceType = candidate_profile)

JobOffer
→ document RAG d’offre
→ RagDocumentEmbedding(sourceType = job_offer)
```

Après le module 18 :

```txt
data/profile/pierre-profile-lore.md
data/profile/cv-pierre.md
→ lecture Markdown
→ documents RAG normalisés
→ RagDocumentEmbedding(sourceType = profile_document)

question utilisateur
→ recherche RAG profil structuré + lore + CV + offres
→ réponse LLM avec sources mixtes
→ affichage dans /rag
```

Éléments ajoutés :

- dossier `data/profile/` ;
- document `data/profile/pierre-profile-lore.md` ;
- document `data/profile/cv-pierre.md` ;
- fonction `readProfileDocuments()` ;
- type `ProfileRagDocument` ;
- sourceType dédié `profile_document` ;
- script de preview des documents profil ;
- script d’indexation des documents profil ;
- helper CLI `readCliQuestion()` pour passer les questions aux scripts de recherche/réponse ;
- tests unitaires de lecture des documents profil et de lecture de question CLI ;
- affichage des sources `profile_document` dans `/rag`.

Scripts ajoutés ou utilisés :

```bash
npm run rag:preview-profile-documents
npm run rag:index-profile-documents
npm run rag:check-documents
npm run rag:search-documents -- "Quel type d'environnement professionnel Pierre recherche-t-il ?"
npm run rag:answer-documents -- "Comment Pierre devrait-il se présenter pour une candidature fullstack IA junior ?"
```

Le RAG peut maintenant exploiter trois familles de documents :

```txt
candidate_profile
→ profil candidat structuré actif

profile_document
→ lore profil, CV Markdown, préférences longues, contexte candidature

job_offer
→ offres d’emploi indexées
```

Pourquoi Markdown plutôt que PDF :

- lecture simple ;
- parsing fiable ;
- contenu contrôlable ;
- versionnement Git ;
- coût et bruit réduits ;
- meilleure explicabilité en entretien.

Validation réalisée :

```txt
rag:check-documents
→ 21 documents indexés
→ candidate_profile : 1
→ job_offer : 18
→ profile_document : 2

/rag
→ réponse fondée sur Profil candidat — Pierre
→ Profil long — Pierre Mouton
→ CV Markdown — Pierre Mouton
→ offres indexées si pertinentes
```

Limite volontaire : les documents sont indexés en bloc. Le chunking par sections, l’upload UI et le parsing PDF sont gardés pour plus tard afin de ne pas complexifier ce module.

---

### Module 19 — V2 : presets Apify dynamiques et adapters par source

Statut : terminé.

Objectif : ne plus dépendre uniquement de presets Apify hardcodés, mais générer des inputs Apify depuis le scénario de recherche actif, tout en gardant les anciens presets compatibles.

Avant le module 19 :

```txt
--preset=indeed-nancy-dev
→ input Apify hardcodé
→ run actor
→ dataset
→ mapping
→ import
```

Après le module 19 :

```txt
SearchScenario actif
→ JobSearchCriteria
→ ApifyActorAdapter
→ run plan par source / localisation
→ preview de l’input généré
→ run actor contrôlé avec --run-actor
→ dataset
→ mapper source-specific
→ import PostgreSQL
```

Éléments ajoutés :

- type `JobSearchCriteria` ;
- fonction `mapSearchScenarioToJobSearchCriteria()` ;
- fonction `buildCompactSearchText()` pour éviter les requêtes Apify trop longues ;
- type `ApifyActorAdapter` ;
- registry d’adapters Apify ;
- limites minimales et limites par défaut par actor ;
- helpers `getSafeLimit()` et `getPrimaryLocation()` ;
- adapters Apify pour Indeed, LinkedIn et Meteojob ;
- stratégie spécifique Meteojob avec URL de recherche `meteojob.com/jobs?...` ;
- run plan Apify par localisation avec `buildApifyActorRunPlan()` ;
- script `preview-apify-actor-inputs.ts` ;
- script npm `apify:preview-inputs` ;
- option CLI `--from-scenario` dans `external:import` ;
- option CLI `--location=...` pour cibler une localisation ;
- support de `--source=meteojob` ;
- affichage de l’input Apify généré avant lancement réel ;
- affichage de la limite effective envoyée à l’actor ;
- schéma Zod Meteojob ;
- mapper Meteojob vers `ExternalJobOffer` ;
- tests unitaires pour les critères de recherche, adapters, run plans et mapper Meteojob.

Sources Apify validées dans ce module :

```txt
indeed
linkedin
meteojob
```

Commandes utiles :

```bash
npm run apify:preview-inputs

npm run apify:preview-inputs -- --source=indeed --location=Nancy --limit=5
npm run apify:preview-inputs -- --source=linkedin --location="Grand Est" --limit=5
npm run apify:preview-inputs -- --source=meteojob --location="Grand Est" --limit=25

npm run external:import -- --input=apify-actor --source=indeed --from-scenario --location=Nancy --limit=5 --dry-run --run-actor

npm run external:import -- --input=apify-actor --source=linkedin --from-scenario --location="Grand Est" --limit=5 --dry-run --run-actor

npm run external:import -- --input=apify-actor --source=meteojob --from-scenario --location="Grand Est" --limit=25 --dry-run --run-actor
```

Ce que le module a validé :

```txt
Indeed
→ input dynamique depuis SearchScenario
→ run Apify réel
→ raw item récupéré
→ mapping réussi
→ dry-run sans écriture DB

LinkedIn
→ input dynamique depuis SearchScenario
→ limite demandée 5 remontée à 10 par l’adapter
→ run Apify réel
→ 0 résultat avec Grand Est, mais pipeline sans erreur

Meteojob
→ input URL généré dynamiquement
→ actor stealth_mode/meteojob-jobs-search-scraper
→ résultats récupérés
→ mapping vers ExternalJobOffer
→ import possible
```

Décisions importantes :

- les anciens presets restent disponibles ;
- le nouveau mode `--from-scenario` est optionnel ;
- un vrai lancement Apify exige toujours `--run-actor` ;
- `--dry-run` empêche l’écriture en base, mais ne bloque pas le coût Apify si `--run-actor` est présent ;
- les différences entre actors sont isolées dans les adapters ;
- les différences entre formats de sortie sont isolées dans les mappers ;
- Meteojob utilise une requête plus large que Indeed/LinkedIn, car son moteur retourne mieux des résultats avec une recherche courte ;
- les requêtes larges comme `développeur web` sont utiles pour obtenir du volume, mais elles peuvent produire du bruit ;
- le préfiltre profil avant import n’est pas ajouté dans ce module.

Limite volontaire :

Le module 19 ne construit pas encore l’UI de pilotage. Il prépare les adapters, les run plans et les commandes nécessaires. L’interface de pilotage est ensuite construite dans le module 20.

---

### Module 20 — V2 : interface de pilotage des imports Apify

Statut : terminé.

Objectif : transformer les scripts et previews Apify du module 19 en une interface utilisable depuis l’application.

Avant le module 20 :

```txt
CLI external:import / apify:preview-inputs
→ génération des inputs Apify
→ lancement manuel via terminal
→ lecture du résultat dans les logs
```

Après le module 20 :

```txt
/imports
→ scénario actif affiché
→ sources Apify supportées affichées
→ plans de run Apify affichés
→ inputs générés visibles
→ commandes CLI rappelées
→ bouton de campagne d’import
→ modal de confirmation
→ sélection des sources
→ sélection des localisations
→ ajout d’une localisation custom
→ lancement côté serveur
→ actors Apify
→ datasets
→ mappers source-specific
→ import PostgreSQL réel
→ rapport de campagne affiché dans l’UI
```

Éléments ajoutés :

- page `/imports` ;
- affichage du `SearchScenario` actif ;
- affichage des adapters disponibles via `listApifyActorAdapters()` ;
- view model des sources d’import ;
- view model des plans de run Apify ;
- affichage des inputs Apify générés ;
- affichage des commandes CLI de preview et dry-run ;
- fonction serveur `runApifyImportCampaign()` ;
- Server Action `runImportCampaignAction()` ;
- composant client `ImportCampaignButton` ;
- modal de confirmation avant lancement ;
- sélection des sources à lancer ;
- sélection des localisations à lancer ;
- ajout d’une localisation custom ;
- import réel en base depuis l’UI ;
- rapport de campagne avec durée, plans lancés, items bruts, offres mappées, uniques, créées, mises à jour, doublons ignorés et erreurs.

Sources pilotables depuis l’UI :

```txt
indeed
linkedin
meteojob
```

Garde-fous conservés :

- le token `APIFY_TOKEN` reste côté serveur ;
- aucun token n’est exposé dans un composant client ;
- le lancement depuis l’UI passe par une Server Action ;
- l’utilisateur confirme la campagne dans une modal ;
- les sources et localisations sont sélectionnables ;
- les doublons sont gérés par le pipeline d’import existant ;
- la CLI garde ses modes `--dry-run` et `--run-actor` pour tester les imports sans écriture DB.

Validations réalisées :

```txt
Campagne Indeed seule
→ 3 plans lancés
→ 22 items bruts
→ 0 erreur

Campagne LinkedIn avec localisation custom "Metz, Grand Est"
→ 1 plan lancé
→ 18 items bruts
→ 16 créations
→ 2 mises à jour
→ 0 erreur
```

Décisions importantes :

- la page `/imports` n’est pas un espace admin, car l’application reste personnelle et sans authentification ;
- l’UI lance de vrais imports, pas seulement des dry-runs ;
- les dry-runs restent disponibles côté CLI pour tester une source ou un adapter ;
- les localisations custom permettent de compenser les différences d’interprétation entre actors, par exemple `Metz` vs `Metz, Grand Est` pour LinkedIn ;
- les requêtes larges comme `développeur web` augmentent le volume mais introduisent du bruit.

Limite volontaire :

Le module 20 ne fait pas encore de préfiltre profil avant import. Les offres peu pertinentes peuvent donc encore entrer en base. Ce sujet est traité au module 21.

---


### Module 21 — V2 : pertinence des imports et scoring final

Statut : terminé.

Objectif : réduire le bruit des imports larges et rendre le classement final des offres plus fiable, plus tolérant et plus explicable.

Le module 21 regroupe deux volets complémentaires :

```txt
21A — préfiltre de pertinence avant import
21B — révision du scoring final et de la priorité UI
```

Problème observé avant le module :

```txt
requête large Apify, par exemple "développeur web"
→ bon volume d’offres
→ mais beaucoup d’offres hors métier
→ pollution progressive de la base
→ scoring final parfois trop sévère sur les offres techniques imparfaites
```

Décision de conception : le préfiltre et le scoring final n’ont pas le même rôle.

```txt
Préfiltre 21A
= décider si une offre mérite d’entrer en base
= strict sur le hors-métier évident
= pas d’appel IA

Scoring final 21B
= classer les offres techniques restantes
= tolérant sur les données manquantes, le senior, les localisations hors préférences
= explicable dans l’UI
```

#### 21A — Préfiltre de pertinence avant import

Pipeline mis en place :

```txt
raw items Apify
→ mapping ExternalJobOffer
→ préparation / nettoyage / normalisation
→ déduplication
→ score de pertinence externe
→ acceptation ou rejet
→ import PostgreSQL uniquement des offres acceptées
```

Éléments ajoutés :

- `lib/imports/external-offer-relevance-filter.ts` ;
- score déterministe de pertinence sur 100 ;
- seuil par défaut assoupli à 40 ;
- fonction pure `scoreExternalOfferRelevance()` ;
- fonction pure `filterExternalOffersByRelevance()` ;
- raisons positives et négatives de scoring ;
- comptage des principales raisons de rejet ;
- intégration optionnelle dans `importExternalJobOffersToDb()` ;
- activation du préfiltre dans les campagnes Apify UI ;
- prise en compte des localisations sélectionnées dans le run, y compris localisations custom ;
- affichage UI des offres acceptées et rejetées par le préfiltre ;
- affichage des principales raisons de rejet dans le rapport de campagne `/imports` ;
- tests unitaires Vitest du préfiltre.

Philosophie du filtre :

```txt
Strict sur :
- Business Developer
- commercial / sales
- franchise
- conseiller patrimoine
- marketing pur
- enseignement / formation
- legacy très éloigné sans signal web moderne

Tolérant sur :
- senior
- lead
- ingénieur
- Bac+5
- localisation hors préférences
- ville custom choisie au moment du run
- stack technique imparfaite mais exploitable
```

Exemples de comportements attendus :

```txt
Business Developer sédentaire
→ rejet avant import

Développeur Full-stack PHP / JavaScript
→ accepté pour analyse ultérieure

Développeur Front-End Senior React TypeScript
→ accepté, senior traité comme vigilance

Analyste Développeur COBOL AS400 sans signal web moderne
→ rejet

Développeur JavaScript à Troyes si Troyes est la localisation custom du run
→ pas de pénalité de localisation
```

Le rapport de campagne affiche maintenant notamment :

```txt
Préparées
Uniques
Acceptées filtre
Rejetées filtre
Créées
Mises à jour
Principales raisons de rejet
```

#### Nettoyage ponctuel de la base

Le module ajoute aussi un script de nettoyage hors UI pour retirer les offres peu pertinentes déjà entrées en base lors des tests précédents.

Fichier ajouté :

- `scripts/cleanup-irrelevant-job-offers.ts`

Commande npm :

```bash
npm run db:cleanup:irrelevant-offers
```

Comportement :

- dry-run par défaut ;
- réutilise le même préfiltre que les imports ;
- affiche les offres qui seraient supprimées ;
- affiche les raisons principales ;
- ne supprime rien sans `--apply` ;
- cible par défaut les sources Apify ;
- peut limiter le volume avec `--limit` ;
- peut inspecter toutes les sources avec `--all-sources`.

Commandes utiles :

```bash
npm run db:cleanup:irrelevant-offers
npm run db:cleanup:irrelevant-offers -- --limit=50
npm run db:cleanup:irrelevant-offers -- --min-score=40
npm run db:cleanup:irrelevant-offers -- --apply --min-score=40
npm run db:cleanup:irrelevant-offers -- --all-sources
```

#### 21B — Révision du scoring final et de la priorité

Objectif : corriger un scoring trop punitif sur des offres pourtant intéressantes.

Avant :

```txt
remote inconnu
+ salaire absent
+ analyse IA absente
+ niveau senior
+ localisation hors préférences
+ compétences détectées incomplètes
→ score parfois trop bas
```

Après :

```txt
stack pertinente
+ titre développeur web / fullstack / frontend / backend
+ contrat compatible
+ signaux IA positifs
+ données exploitables
→ score cohérent

senior / Bac+5 / localisation faible / analyse IA absente
→ points de vigilance
→ pas rejet automatique
```

Éléments modifiés :

- `lib/scoring/score-job-offer.ts` ;
- `lib/scoring/prioritize-job-offer.ts` ;
- `lib/offers/get-offers.ts` ;
- `components/offers/OfferCard.tsx` ;
- `components/offers/OfferFilters.tsx` ;
- `app/offers/page.tsx`.

Le scoring final prend maintenant en compte :

- alignement du titre ;
- compétences fortes et compétences en apprentissage ;
- niveau d’expérience avec senior non bloquant ;
- remote inconnu non bloquant ;
- contrat inconnu non bloquant ;
- localisation hors préférences faiblement pénalisée ;
- signaux IA positifs ;
- red flags IA ;
- salaire mentionné avec impact faible ;
- qualité des données ;
- exigences explicites de diplôme ingénieur / Bac+5 comme vigilance.

La priorisation a été revue :

- une offre senior React / TypeScript n’est plus automatiquement ignorée ;
- une offre sans analyse IA mais avec un score correct devient `needs_ai_analysis` ;
- une offre avec red flags peut devenir `watch` ou `low_priority` selon le score ;
- les offres clairement hors cible commerciale restent `probably_ignore` ;
- le score global reste la base de la décision, enrichie par les raisons de priorité.

Niveaux de priorité conservés :

```txt
very_promising
interesting
needs_ai_analysis
watch
low_priority
probably_ignore
```

L’interface `/offers` affiche maintenant :

- score de compatibilité ;
- label du score ;
- badge de priorité ;
- badge `Analyse IA disponible` ou `Analyse IA absente` ;
- points positifs ;
- points de vigilance ;
- filtre rapide par priorité ;
- tri `Priorité puis meilleur score`.

Exemples d’URL utiles :

```txt
/offers?sort=priority-desc
/offers?priority=needs_ai_analysis
/offers?priority=interesting
/offers?priority=watch
```

Tests ajoutés ou mis à jour :

- tests du préfiltre de pertinence externe ;
- tests de priorisation ;
- validation TypeScript avec `npm run check`.

Commandes de validation :

```bash
npm run test -- external-offer-relevance-filter
npm run test -- prioritize-job-offer
npm run check
```

Décisions importantes :

- pas de LLM dans le préfiltre ;
- le préfiltre ne remplace pas le scoring final ;
- le scoring final ne doit pas servir à décider brutalement de l’import ;
- les informations manquantes doivent être traitées comme inconnues, pas comme négatives ;
- les offres techniques imparfaites doivent entrer en base puis être classées ;
- les offres manifestement hors métier doivent être écartées avant import ;
- le nettoyage DB reste un script volontaire, jamais une action UI automatique.

Limites volontaires :

- les offres rejetées par le préfiltre ne sont pas persistées dans une table dédiée ;
- le nettoyage DB ne nettoie pas encore automatiquement l’index RAG générique ;
- le scoring `/offers` dépend encore du profil TypeScript historique côté UI ;
- l’UI ne permet pas encore de régler le seuil du préfiltre ;
- l’historique complet des campagnes d’import n’est pas encore persisté.

---

## Prochains modules

### Module 22 — Distribution du rapport

Statut : à venir.

Objectif : envoyer le daily check vers un canal externe.

Pistes :

- email ;
- WhatsApp ;
- Telegram ;
- Slack / Discord ;
- intégration ou expérimentation OpenClaw.

Principe :

```txt
JobRadar génère le rapport.
Un canal externe le transmet.
Aucune action sensible automatique.
```

---

## Pages disponibles

- `/offers` : liste des offres avec pagination, filtres, tri, score, priorité, état d’analyse IA et raisons principales.
- `/offers/[id]` : détail d’une offre, analyse IA, score, métadonnées.
- `/scraping-runs` : historique des imports/runs.
- `/data-quality` : qualité technique des données.
- `/profile` : profil candidat actuel.
- `/rag` : interface RAG profil-aware utilisant le profil candidat, les documents profil/CV Markdown et les offres indexées.
- `/imports` : pilotage des campagnes Apify, sélection des sources/localisations, lancement côté serveur, préfiltre profil et rapport de campagne.
- `/agent` : agent avec tools contrôlés.
- `/fake-dynamic-jobs` : page locale de test Playwright.

---

## Scripts principaux

### Développement

```bash
npm install
npm run dev
npm run build
npm run check
```

### Base de données

```bash
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:studio
npm run db:cleanup:irrelevant-offers
```

### Nettoyage ponctuel des offres peu pertinentes

```bash
npm run db:cleanup:irrelevant-offers
npm run db:cleanup:irrelevant-offers -- --limit=50
npm run db:cleanup:irrelevant-offers -- --apply --min-score=40
```

Par défaut, le script fonctionne en dry-run et ne supprime rien sans `--apply`.

### Scraping pédagogique

```bash
npm run scrape:static
npm run scrape:dynamic
npm run db:import:scraped
```

### Imports externes V2

```bash
npm run external:preview
npm run external:import
npm run apify:preview-inputs
```

Exemples historiques avec presets :

```bash
npm run external:import -- --input=json --source=indeed --actor=MXLpngmVpE8WTESQr --dry-run --limit=3 ./data/external/indeed-apify-export.json

npm run external:import -- --input=apify-actor --source=indeed --preset=indeed-nancy-dev --dry-run --run-actor

npm run external:import -- --input=apify-actor --source=linkedin --preset=linkedin-grand-est-dev --dry-run --run-actor
```

Preview des inputs Apify générés depuis le scénario actif :

```bash
npm run apify:preview-inputs
npm run apify:preview-inputs -- --source=indeed --location=Nancy --limit=5
npm run apify:preview-inputs -- --source=linkedin --location="Grand Est" --limit=5
npm run apify:preview-inputs -- --source=meteojob --location="Grand Est" --limit=25
```

Imports Apify dynamiques depuis le scénario actif :

```bash
npm run external:import -- --input=apify-actor --source=indeed --from-scenario --location=Nancy --limit=5 --dry-run --run-actor

npm run external:import -- --input=apify-actor --source=linkedin --from-scenario --location="Grand Est" --limit=5 --dry-run --run-actor

npm run external:import -- --input=apify-actor --source=meteojob --from-scenario --location="Grand Est" --limit=25 --dry-run --run-actor
```

Sources supportées à ce stade :

```txt
indeed
linkedin
meteojob
```

Interface de pilotage :

```txt
/imports
→ sélectionner les sources Apify
→ sélectionner les localisations
→ ajouter une localisation custom
→ lancer une campagne d’import réelle après confirmation
→ appliquer le préfiltre profil avant insertion en base
→ consulter le rapport de campagne dans l’UI
```

### IA

```bash
npm run ai:test
npm run ai:test:save
npm run ai:analyze-candidates -- --limit=5 --dry-run
npm run ai:analyze-candidates -- --limit=5 --run
```

### RAG

```bash
npm run rag:preview-profile-document
npm run rag:index-profile-document
npm run rag:preview-profile-documents
npm run rag:index-profile-documents
npm run rag:index-job-offer-documents
npm run rag:check-documents
npm run rag:search-documents
npm run rag:answer-documents
```

Utilisation recommandée après modification du profil structuré :

```bash
npm run rag:index-profile-document
npm run rag:check-documents
```

Utilisation recommandée après modification des documents Markdown de profil/CV :

```bash
npm run rag:preview-profile-documents
npm run rag:index-profile-documents
npm run rag:check-documents
```

Utilisation recommandée après de nouveaux imports d’offres :

```bash
npm run rag:index-job-offer-documents
npm run rag:check-documents
```

Les scripts de test acceptent une question en argument CLI :

```bash
npm run rag:search-documents -- "Quel type d'environnement professionnel Pierre recherche-t-il ?"
npm run rag:answer-documents -- "Comment Pierre devrait-il se présenter pour une candidature fullstack IA junior ?"
```

Note : le script actuel d’indexation des offres peut volontairement limiter le nombre d’offres indexées afin de contrôler les coûts OpenAI.

### Reporting

```bash
npm run report:generate
```

---

## Variables d’environnement

Exemple `.env.example` :

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME"
OPENAI_API_KEY="your_api_key_here"
APIFY_TOKEN="your_apify_token_here"
USE_FAKE_AI=true
USE_FAKE_SCRAPER=true
```

Règles :

- ne jamais committer `.env` ou `.env.local` ;
- ne jamais exposer `OPENAI_API_KEY` côté client ;
- ne jamais exposer `APIFY_TOKEN` côté client ;
- garder les appels OpenAI et Apify côté serveur/scripts.

---

## Sécurité et garde-fous

Le projet respecte plusieurs règles :

- ne pas committer les clés ;
- garder les tokens côté serveur/local ;
- ne pas appeler automatiquement l’IA sur toutes les offres ;
- déclencher l’analyse IA manuellement ou avec un flag explicite ;
- stocker les analyses pour éviter les appels répétés ;
- ignorer automatiquement les offres déjà analysées dans le batch IA ;
- limiter le nombre d’analyses par run avec `--limit` ;
- afficher une estimation indicative avant exécution ;
- afficher les tokens consommés ;
- estimer le coût des requêtes IA ;
- contrôler le volume d’embeddings générés pour le RAG ;
- privilégier des documents Markdown versionnés pour le profil/CV plutôt qu’un parsing PDF fragile au début ;
- ne pas scraper agressivement des sources sensibles ;
- ne pas contourner de protections anti-bot ;
- traiter Apify comme une source externe contrôlée, pas comme une autorisation automatique ;
- prévisualiser les inputs Apify dynamiques avant lancement réel ;
- garder `--run-actor` obligatoire pour tout lancement d’actor depuis la CLI ;
- lancer les campagnes UI via une Server Action côté serveur ;
- demander une confirmation UI avant lancement d’une campagne Apify ;
- sélectionner explicitement les sources et localisations à lancer ;
- filtrer les offres hors métier avant import en base ;
- garder le nettoyage des offres peu pertinentes en dry-run par défaut ;
- distinguer limite demandée et limite effective imposée par un adapter ;
- garder les futures actions d’agent sous contrôle humain ;
- ne pas automatiser les candidatures.

---

## Organisation Git recommandée

```txt
main
→ version stable et montrable

develop
→ intégration

feature/v2-...
→ modules V2
```

Avant chaque module :

```bash
git checkout develop
git pull origin develop
git checkout -b feature/v2-nom-du-module
```

Avant merge :

```bash
npm run check
git status
```

Commits recommandés récents :

```bash
git add .
git commit -m "feat(reporting): generate job watch markdown report"

git add .
git commit -m "feat(search-context): add candidate profiles and search scenarios"

git add .
git commit -m "feat(scoring): add heuristic offer prioritization"

git add .
git commit -m "feat(ai): analyze prioritized offers with controlled CLI"

git add .
git commit -m "feat(rag): add profile-aware generic document retrieval"

git add .
git commit -m "feat(rag): index profile markdown documents"

git add .
git commit -m "feat(apify): generate actor inputs from search scenarios"

git add .
git commit -m "feat(imports): add Apify import campaign UI"

git add .
git commit -m "feat(imports): filter irrelevant offers before import"

git add .
git commit -m "feat(scoring): make offer scoring and priority more tolerant"
```

---

## Ce que ce projet montre en entretien

JobRadar IA permet d’expliquer :

- pourquoi commencer avec des sources fictives ;
- comment fonctionne le scraping statique ;
- pourquoi Playwright est utile pour les pages dynamiques ;
- pourquoi stocker les données en base ;
- comment éviter les doublons ;
- comment fonctionne Prisma ;
- comment utiliser des migrations ;
- pourquoi nettoyer les données avant l’IA ;
- comment utiliser un LLM pour produire une sortie structurée ;
- pourquoi valider avec Zod ;
- comment suivre les tokens et estimer les coûts ;
- comment importer des datasets externes ;
- comment mapper des formats hétérogènes vers un format pivot ;
- comment intégrer Apify avec des garde-fous ;
- comment générer des inputs Apify depuis un scénario de recherche ;
- pourquoi utiliser des adapters par actor plutôt qu’un mapping universel ;
- comment intégrer une nouvelle source comme Meteojob sans casser le pipeline existant ;
- comment transformer des scripts d’import en interface de pilotage contrôlée ;
- comment lancer une campagne Apify depuis une Server Action sans exposer le token ;
- comment afficher un rapport d’exécution exploitable côté UI ;
- comment préfiltrer des imports bruités sans appel IA ;
- comment distinguer préfiltre d’import, scoring final et priorisation ;
- comment rendre un scoring explicable avec points positifs et points de vigilance ;
- comment générer un rapport opérationnel ;
- comment prioriser des offres avec des règles déterministes ;
- comment contrôler des appels IA batch avec dry-run, limite et flag explicite ;
- comment fonctionne un RAG avec embeddings et pgvector ;
- pourquoi généraliser un index RAG avec `sourceType` / `sourceId` ;
- comment enrichir le retrieval avec un profil candidat actif ;
- comment intégrer un CV Markdown et du lore profil dans un RAG existant ;
- pourquoi utiliser `profile_document` comme type de source distinct ;
- comment afficher des sources RAG mixtes dans l’interface ;
- comment préparer une application IA sérieuse avec contrôle humain.

---

## Limites actuelles

Le projet reste pédagogique et personnel.

Limites connues :

- les imports réels dépendent des actors et exports externes ;
- un actor Apify ne rend pas automatiquement une source juridiquement autorisée ;
- les mappers doivent être maintenus source par source ;
- les adapters Apify doivent aussi être maintenus source par source ;
- les requêtes larges comme `développeur web` produisent du volume mais aussi beaucoup de bruit, même si le préfiltre en réduit une partie ;
- LinkedIn peut interpréter certaines localisations différemment, par exemple `Metz` peut retourner 0 alors que `Metz, Grand Est` fonctionne ;
- le scoring côté UI dépend encore partiellement d’un profil TypeScript historique ;
- les profils/scénarios sont en base, mais leur UI de gestion reste à construire ;
- l’analyse IA contrôlée existe en CLI, mais n’a pas encore d’interface dédiée ;
- l’estimation de coût avant appel IA reste indicative ;
- le RAG générique indexe le profil structuré, les documents Markdown de profil/CV et des offres ;
- les documents profil/CV sont indexés en bloc, sans chunking par section pour le moment ;
- il n’y a pas encore d’upload UI, de parsing PDF ou de gestion avancée des documents profil ;
- l’ancien index `JobOfferEmbedding` existe encore comme héritage V1 et pourra être déprécié plus tard ;
- l’indexation RAG des nouvelles offres doit encore être lancée manuellement après import ;
- l’UI de pilotage des imports existe avec rapport immédiat, mais elle n’a pas encore d’historique persistant de campagnes ;
- les localisations custom sont saisies manuellement et ne sont pas encore sauvegardées dans un scénario ;
- les inputs custom par actor ne sont pas encore exposés dans l’UI ;
- le lancement multi-localisations fonctionne, mais un mode asynchrone pourra être nécessaire en cas de déploiement avec timeouts ;
- les offres rejetées par le préfiltre ne sont pas encore persistées dans une table dédiée ;
- le nettoyage DB des offres peu pertinentes ne nettoie pas encore automatiquement les documents RAG associés ;
- la distribution du rapport n’est pas encore faite.

Ces limites sont volontaires : le projet avance module par module.

---

## Licence

Projet personnel pédagogique et portfolio.

Les données utilisées dans les premiers modules sont fictives ou contrôlées. Les imports externes et actors Apify sont utilisés avec prudence, dans une logique d’apprentissage, de traçabilité et de contrôle des coûts.

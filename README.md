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
- interroger les offres, le profil candidat et des documents métiers avec du RAG ;
- utiliser un agent avec tools contrôlés ;
- générer un rapport Markdown de veille ;
- préparer ensuite l’indexation de documents de profil/CV, une orchestration Apify plus dynamique et une UI de pilotage.

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
→ import PostgreSQL
→ navigation UI sur volume réel
→ scoring profil
→ priorisation heuristique
→ rapport Markdown de veille
→ profils candidat + scénarios de recherche
→ analyse IA contrôlée par limite et budget
→ RAG générique profil + offres
→ documents profil/CV dans le RAG
→ orchestration Apify depuis l’interface
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
- agent avec tools contrôlés ;
- import externe depuis JSON / dataset / actors Apify ;
- mappers source-specific Indeed et LinkedIn ;
- format pivot `ExternalJobOffer` ;
- interface `/offers` adaptée à un vrai volume d’offres ;
- pagination serveur, filtres, tri et responsive mobile-first ;
- rapport Markdown local de veille ;
- profils candidat et scénarios de recherche stockés en base ;
- priorisation heuristique des offres avec file de priorité ;
- analyse IA contrôlée par CLI avec `--dry-run`, `--limit` et `--run` ;
- tests unitaires avec Vitest ;
- lint, build et script global de vérification.

---

## Pipeline fonctionnel actuel

```txt
sources fictives / pages contrôlées
ou exports JSON / datasets / actors Apify
↓
mappers source-specific ou mapping externe
↓
ExternalJobOffer
↓
préparation / nettoyage / normalisation
↓
déduplication
↓
import PostgreSQL avec upsert par URL normalisée
↓
ScrapingRun
↓
affichage Next.js
↓
scoring profil
↓
priorisation heuristique
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
indexation RAG générique du profil et des offres
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
- comment construire un rapport opérationnel de veille ;
- comment ajouter des garde-fous autour des appels IA ;
- comment fonctionne un RAG avec embeddings, pgvector, contexte et sources ;
- comment faire évoluer un RAG centré offres vers un index documentaire générique ;
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
- Tool calling
- Agent avec tools contrôlés
- Mode fake IA avec `USE_FAKE_AI`
- CLI d’analyse IA contrôlée avec limite et dry-run

### Qualité / tests

- Vitest
- TypeScript
- ESLint
- Script global `npm run check`

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
│  ├─ imports/
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
│  │  └─ search-rag-documents.ts
│  ├─ scoring/
│  │  ├─ score-job-offer.ts
│  │  ├─ prioritize-job-offer.ts
│  │  └─ map-db-offer-to-scorable-offer.ts
│  ├─ scraping/
│  ├─ search-context/
│  ├─ sources/
│  └─ prisma.ts
│
├─ scripts/
│  ├─ import-scraped-jobs.ts
│  ├─ preview-external-import.ts
│  ├─ import-external-offers.ts
│  ├─ generate-jobradar-report.ts
│  ├─ analyze-ai-candidates.ts
│  ├─ index-candidate-profile-rag-document.ts
│  ├─ index-job-offers-rag-documents.ts
│  ├─ check-rag-document-embeddings.ts
│  ├─ test-rag-document-search.ts
│  ├─ test-rag-document-answer.ts
│  └─ ...
│
├─ data/
│  ├─ scraped-jobs.json
│  ├─ dynamic-scraped-jobs.json
│  └─ external/
│
├─ reports/
│  └─ jobradar-report-YYYY-MM-DD.md
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
- qualité des données.

Le score est utilisé dans l’interface et dans le rapport Markdown.

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
--source=indeed|linkedin
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
profile_document plus tard
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

Limite volontaire : le module 17 indexe le profil structuré et les offres. Les documents longs de profil, le “lore” candidat et le CV Markdown sont reportés au module suivant pour garder un périmètre clair.

---

## Prochains modules

### Module 18 — Documents profil/CV dans le RAG

Statut : à venir.

Objectif : enrichir le nouvel index RAG générique avec des documents personnels plus longs que le profil structuré.

Approche recommandée :

```txt
data/profile/pierre-profile-lore.md
data/profile/cv-pierre.md
→ lecture du Markdown
→ createRagDocumentEmbedding(sourceType = profile_document)
→ recherche RAG profil structuré + lore + CV + offres
```

Ce module permettra d’ajouter :

- parcours détaillé ;
- reconversion ;
- préférences professionnelles ;
- contexte de recherche ;
- points forts transverses ;
- CV Markdown ;
- documents utiles pour de futures candidatures.

À éviter au début : parser directement un PDF CV. Une version Markdown ou texte propre est plus fiable pour apprendre et garder un RAG explicable.

---

### Module 19 — Presets Apify dynamiques et interface de lancement

Statut : à venir.

Objectif : ne plus hardcoder chaque preset Apify.

Approche :

```txt
SearchScenario
→ variables de recherche
→ template d’input actor
→ run Apify contrôlé
→ dataset
→ mapper
→ import DB
→ rapport
```

Garde-fous :

- pas de lancement sans confirmation ;
- pas de contournement anti-bot ;
- limites de volume ;
- coût surveillé ;
- logs de run.

---

### Module 20 — UI de pilotage

Statut : à venir.

Objectif : rendre le projet démontrable et compréhensible pour un public non technique.

À terme :

- gestion des profils ;
- gestion des scénarios ;
- lancement de runs ;
- lecture du rapport ;
- actions recommandées ;
- suivi coûts / runs / analyses.

---

### Module 21 — Distribution du rapport

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

- `/offers` : liste des offres avec pagination, filtres et tri.
- `/offers/[id]` : détail d’une offre, analyse IA, score, métadonnées.
- `/scraping-runs` : historique des imports/runs.
- `/data-quality` : qualité technique des données.
- `/profile` : profil candidat actuel.
- `/rag` : interface RAG profil-aware utilisant le profil candidat et les offres indexées.
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
```

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
```

Exemples :

```bash
npm run external:import -- --input=json --source=indeed --actor=MXLpngmVpE8WTESQr --dry-run --limit=3 ./data/external/indeed-apify-export.json

npm run external:import -- --input=apify-actor --source=indeed --preset=indeed-nancy-dev --dry-run --run-actor

npm run external:import -- --input=apify-actor --source=linkedin --preset=linkedin-grand-est-dev --dry-run --run-actor
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
npm run rag:index-job-offer-documents
npm run rag:check-documents
npm run rag:search-documents
npm run rag:answer-documents
```

Utilisation recommandée après de nouveaux imports d’offres :

```bash
npm run rag:index-job-offer-documents
npm run rag:check-documents
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
- ne pas scraper agressivement des sources sensibles ;
- ne pas contourner de protections anti-bot ;
- traiter Apify comme une source externe contrôlée, pas comme une autorisation automatique ;
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
- comment générer un rapport opérationnel ;
- comment prioriser des offres avec des règles déterministes ;
- comment contrôler des appels IA batch avec dry-run, limite et flag explicite ;
- comment fonctionne un RAG avec embeddings et pgvector ;
- pourquoi généraliser un index RAG avec `sourceType` / `sourceId` ;
- comment enrichir le retrieval avec un profil candidat actif ;
- comment afficher des sources RAG mixtes dans l’interface ;
- comment préparer une application IA sérieuse avec contrôle humain.

---

## Limites actuelles

Le projet reste pédagogique et personnel.

Limites connues :

- les imports réels dépendent des actors et exports externes ;
- un actor Apify ne rend pas automatiquement une source juridiquement autorisée ;
- les mappers doivent être maintenus source par source ;
- le scoring côté UI dépend encore partiellement d’un profil TypeScript historique ;
- les profils/scénarios sont en base, mais leur UI de gestion reste à construire ;
- l’analyse IA contrôlée existe en CLI, mais n’a pas encore d’interface dédiée ;
- l’estimation de coût avant appel IA reste indicative ;
- le RAG générique indexe déjà le profil structuré et des offres, mais pas encore le CV ou les documents longs de profil ;
- l’ancien index `JobOfferEmbedding` existe encore comme héritage V1 et pourra être déprécié plus tard ;
- l’indexation RAG des nouvelles offres doit encore être lancée manuellement après import ;
- l’UI de pilotage V2 reste à construire ;
- la distribution du rapport n’est pas encore faite.

Ces limites sont volontaires : le projet avance module par module.

---

## Licence

Projet personnel pédagogique et portfolio.

Les données utilisées dans les premiers modules sont fictives ou contrôlées. Les imports externes et actors Apify sont utilisés avec prudence, dans une logique d’apprentissage, de traçabilité et de contrôle des coûts.

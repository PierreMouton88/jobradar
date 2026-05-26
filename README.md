# JobRadar IA

JobRadar IA est un projet pédagogique et portfolio autour du scraping, de la structuration de données et de l’intelligence artificielle appliquée à l’analyse d’offres d’emploi.

L’objectif est de construire progressivement une application capable de :

- récupérer des offres depuis des sources contrôlées ;
- nettoyer et normaliser les données ;
- stocker les offres dans PostgreSQL ;
- analyser les offres avec un LLM ;
- valider les sorties IA avec Zod ;
- tracer les coûts et les tokens consommés ;
- comparer les offres à un profil candidat ;
- poser des questions sur les offres avec du RAG ;
- préparer ensuite des agents IA contrôlés.

Le projet avance module par module afin de rester compréhensible, maintenable et explicable en entretien.

---

## Pipeline cible

```txt
scraping
→ nettoyage / normalisation / déduplication
→ PostgreSQL
→ analyse LLM structurée
→ scoring profil
→ embeddings + pgvector
→ RAG
→ agent contrôlé
→ interface Next.js
```

---

## État actuel du projet

Le projet couvre actuellement :

- Module 1 — Next.js minimum viable
- Module 2 — Scraping statique avec Cheerio
- Module 3 — Scraping dynamique avec Playwright
- Module 4 — PostgreSQL + Prisma
- Module 5 — Nettoyage, normalisation, déduplication et qualité des données
- Module 6 — Analyse LLM structurée avec Zod et OpenAI
- Module 7 — Scoring par rapport au profil candidat
- Module 8 — RAG sur les offres avec embeddings et pgvector

Le pipeline fonctionnel actuel est :

```txt
pages fictives / sources contrôlées
→ scraping statique ou dynamique
→ export JSON temporaire
→ nettoyage des données
→ déduplication
→ analyse qualité
→ import PostgreSQL
→ affichage Next.js
→ analyse IA manuelle d’une offre
→ stockage de l’analyse IA
→ scoring par rapport au profil candidat
→ affichage du score
→ tri des offres par pertinence
→ transformation des offres en documents RAG
→ génération d’embeddings
→ stockage pgvector
→ recherche vectorielle
→ réponse RAG avec sources
→ interface /rag
```

Les agents IA contrôlés ne sont pas encore implémentés.

---

## Objectif pédagogique

Ce projet sert d’abord à apprendre.

L’objectif n’est pas seulement d’obtenir une application fonctionnelle, mais de comprendre :

- comment structurer une application Next.js avec App Router ;
- comment extraire des données depuis du HTML ;
- pourquoi Cheerio ne suffit pas pour les pages dynamiques ;
- comment Playwright permet d’automatiser un navigateur ;
- pourquoi passer de fichiers JSON à une vraie base PostgreSQL ;
- comment utiliser Prisma pour gérer les migrations et les relations ;
- comment nettoyer et normaliser des données avant de les exploiter ;
- comment éviter les doublons ;
- comment utiliser un LLM pour produire une analyse structurée ;
- pourquoi valider les sorties IA avec Zod ;
- comment tracer les tokens et les coûts d’une analyse IA ;
- pourquoi ne pas tout confier au LLM ;
- comment créer un scoring explicable avec du TypeScript ;
- ce qu’est un embedding ;
- comment stocker des vecteurs avec pgvector ;
- comment fonctionne une recherche vectorielle ;
- comment construire une réponse RAG avec sources ;
- comment construire un projet présentable en entretien.

---

## Stack technique

### Frontend / fullstack

- Next.js avec App Router
- React
- TypeScript
- Tailwind CSS
- Server Components
- Server Actions

### Scraping

- Cheerio pour le scraping statique
- Playwright pour le scraping dynamique

### Base de données

- PostgreSQL
- pgvector
- Prisma ORM
- Docker Compose pour lancer PostgreSQL en local

### IA

- Vercel AI SDK
- OpenAI API
- Zod
- Structured outputs
- Embeddings OpenAI
- RAG
- Mode fake IA avec `USE_FAKE_AI`
- Stockage des analyses IA en base
- Suivi des tokens consommés
- Estimation indicative du coût par requête

### Scoring

- Profil candidat statique en TypeScript
- Règles de scoring déterministes
- Score de compatibilité
- Explications positives et points de vigilance
- Tri des offres par pertinence

### Prévu plus tard

- agents IA avec tools contrôlés ;
- logs d’utilisation des tools ;
- actions sensibles avec validation humaine ;
- amélioration UI / portfolio ;
- éventuel déploiement.

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
│  │
│  ├─ profile/
│  │  └─ page.tsx
│  │
│  ├─ rag/
│  │  ├─ page.tsx
│  │  ├─ actions.ts
│  │  └─ RagQuestionForm.tsx
│  │
│  ├─ fake-dynamic-jobs/
│  │  └─ page.tsx
│  │
│  ├─ scraping-runs/
│  │  └─ page.tsx
│  │
│  └─ data-quality/
│     └─ page.tsx
│
├─ components/
│  └─ offers/
│     ├─ OfferCard.tsx
│     ├─ OfferList.tsx
│     └─ OfferFilters.tsx
│
├─ lib/
│  ├─ ai/
│  │  ├─ job-analysis-schema.ts
│  │  ├─ analyze-job-offer.ts
│  │  ├─ analyze-and-save-job-offer.ts
│  │  └─ estimate-ai-cost.ts
│  │
│  ├─ offers/
│  │  ├─ get-offers.ts
│  │  ├─ read-scraped-offers.ts
│  │  ├─ offer-cleaning.ts
│  │  ├─ offer-deduplication.ts
│  │  ├─ offer-normalization.ts
│  │  └─ offer-quality.ts
│  │
│  ├─ profile/
│  │  └─ candidate-profile.ts
│  │
│  ├─ scoring/
│  │  └─ score-job-offer.ts
│  │
│  ├─ rag/
│  │  ├─ job-offer-rag-document.ts
│  │  ├─ generate-embedding.ts
│  │  ├─ create-job-offer-embedding.ts
│  │  ├─ search-job-offers.ts
│  │  ├─ answer-question-about-offers.ts
│  │  └─ get-rag-index-stats.ts
│  │
│  ├─ scraping/
│  │  ├─ static-job-parser.ts
│  │  ├─ static-job-parser.test-data.ts
│  │  ├─ export-static-jobs.ts
│  │  ├─ dynamic-job-scraper.ts
│  │  └─ export-dynamic-jobs.ts
│  │
│  └─ prisma.ts
│
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
│
├─ scripts/
│  ├─ import-scraped-jobs.ts
│  ├─ test-cleaning.ts
│  ├─ test-job-analysis.ts
│  ├─ test-analyze-and-save-job-offer.ts
│  ├─ test-job-scoring.ts
│  ├─ check-job-offer-embeddings.ts
│  ├─ generate-missing-job-offer-embeddings.ts
│  ├─ test-rag-search.ts
│  └─ test-rag-answer.ts
│
├─ types/
│  └─ job-offer.ts
│
├─ data/
│  ├─ scraped-jobs.json
│  └─ dynamic-scraped-jobs.json
│
├─ debug/
│  └─ dynamic-scraping-error.png
│
├─ docker-compose.yml
├─ prisma.config.ts
├─ .env.example
└─ README.md
```

---

## Modules réalisés

## Module 1 — Next.js minimum viable

Le premier module a créé une interface minimale avec Next.js.

Routes principales :

```txt
/offers
/offers/[id]
```

Composants principaux :

```txt
components/offers/OfferCard.tsx
components/offers/OfferList.tsx
components/offers/OfferFilters.tsx
```

Type principal côté UI :

```ts
export type ContractType =
  | "CDI"
  | "CDD"
  | "Stage"
  | "Alternance"
  | "Freelance"
  | "Inconnu";

export type JobOffer = {
  id: string;
  title: string;
  company: string;
  location: string;
  contractType: ContractType;
  remote: boolean;
  skills: string[];
  description: string;
  source: string;
  url: string;
  createdAt: string;
  analysis?: JobAnalysisView | null;
  score?: JobOfferScore;
};
```

Les pages ne lisent pas directement la base ou les JSON. Elles passent par :

```txt
lib/offers/get-offers.ts
```

---

## Module 2 — Scraping statique avec Cheerio

Le deuxième module a introduit le scraping statique.

Objectif :

```txt
HTML local contrôlé
→ parsing Cheerio
→ extraction d’offres
→ export JSON
```

Fichiers principaux :

```txt
lib/scraping/static-job-parser.ts
lib/scraping/static-job-parser.test-data.ts
lib/scraping/export-static-jobs.ts
```

Script npm :

```bash
npm run scrape:static
```

Ce script génère :

```txt
data/scraped-jobs.json
```

Type brut utilisé par le parser :

```ts
export type ScrapedJobOffer = {
  title: string;
  company: string;
  location: string;
  contractType: string;
  description: string;
  url: string;
};
```

---

## Module 3 — Scraping dynamique avec Playwright

Le troisième module a introduit Playwright pour comprendre le scraping de pages générées par JavaScript.

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

```txt
/fake-dynamic-jobs
```

Fichiers principaux :

```txt
lib/scraping/dynamic-job-scraper.ts
lib/scraping/export-dynamic-jobs.ts
```

Script npm :

```bash
npm run scrape:dynamic
```

Ce script génère :

```txt
data/dynamic-scraped-jobs.json
```

En cas d’erreur, un screenshot peut être généré dans :

```txt
debug/dynamic-scraping-error.png
```

---

## Module 4 — PostgreSQL + Prisma

Le quatrième module a ajouté une vraie base de données.

Objectif :

```txt
JSON temporaires
→ import en base PostgreSQL
→ lecture avec Prisma
→ affichage dans Next.js
```

### Pourquoi PostgreSQL ?

Les fichiers JSON sont pratiques pour apprendre, mais limités pour :

- stocker durablement les données ;
- éviter les doublons proprement ;
- filtrer et trier efficacement ;
- garder l’historique des imports ;
- préparer les futures étapes IA/RAG.

### Pourquoi Prisma ?

Prisma sert d’intermédiaire entre TypeScript et PostgreSQL.

Il apporte :

- un schéma versionné ;
- des migrations ;
- un client TypeScript typé ;
- des requêtes lisibles ;
- `upsert` pour créer ou mettre à jour une offre selon son URL.

---

## Module 5 — Nettoyage, normalisation, déduplication et qualité

Le cinquième module a amélioré la qualité des données avant la couche IA.

Objectif :

```txt
données brutes
→ données nettoyées
→ données normalisées
→ données dédupliquées
→ données traçables
```

Fonctionnalités ajoutées :

- nettoyage des chaînes de caractères ;
- normalisation des URLs ;
- suppression des paramètres UTM ;
- suppression des slashs finaux inutiles ;
- détection améliorée du télétravail ;
- détection améliorée des compétences techniques ;
- déduplication par URL normalisée ;
- déduplication par clé métier `title + company + location` ;
- rapport de déduplication ;
- analyse qualité des offres ;
- stockage `qualityScore` et `qualityIssues` en base ;
- page `/data-quality`.

Fichiers principaux :

```txt
lib/offers/offer-cleaning.ts
lib/offers/offer-deduplication.ts
lib/offers/offer-quality.ts
lib/offers/offer-normalization.ts
lib/offers/read-scraped-offers.ts
app/data-quality/page.tsx
```

La page qualité est disponible ici :

```txt
/data-quality
```

Elle affiche notamment :

- le nombre total d’offres ;
- le score qualité moyen ;
- les offres avec anomalies ;
- les anomalies les plus fréquentes ;
- les offres à vérifier en priorité.

---

## Module 6 — LLM structured extraction

Le sixième module a ajouté une analyse IA structurée des offres.

Objectif :

```txt
description d’offre
→ LLM
→ objet structuré
→ validation Zod
→ stockage PostgreSQL
→ affichage dans la page détail
```

L’analyse IA est déclenchée manuellement depuis :

```txt
/offers/[id]
```

Le bouton appelle une Server Action Next.js :

```txt
app/offers/[id]/actions.ts
```

La logique métier est séparée dans :

```txt
lib/ai/analyze-and-save-job-offer.ts
lib/ai/analyze-job-offer.ts
```

Le schéma de sortie est défini avec Zod dans :

```txt
lib/ai/job-analysis-schema.ts
```

### Données extraites par l’IA

Une analyse contient notamment :

- `summary`
- `requiredSkills`
- `niceToHaveSkills`
- `experienceLevel`
- `remotePolicy`
- `salaryMentioned`
- `redFlags`
- `positiveSignals`

Exemples :

```txt
experienceLevel:
internship | junior | mid | senior | unknown

remotePolicy:
on_site | hybrid | full_remote | unknown
```

### Mode fake IA

Le projet prévoit un mode fake pour éviter les appels API inutiles :

```env
USE_FAKE_AI=true
```

En fake mode :

- pas d’appel OpenAI ;
- pas de consommation de tokens ;
- analyse simulée ;
- pipeline testable localement.

### Mode réel

En mode réel :

```env
USE_FAKE_AI=false
```

L’application appelle OpenAI via le Vercel AI SDK.

La clé API est stockée uniquement côté serveur :

```env
OPENAI_API_KEY="your_api_key_here"
```

Elle ne doit jamais être exposée côté frontend ni commitée.

### Métadonnées IA

Chaque analyse stocke aussi :

- `analysisMode`
- `modelName`
- `inputTokens`
- `outputTokens`
- `totalTokens`

L’interface affiche :

- le mode d’analyse ;
- le modèle utilisé ;
- le nombre de tokens consommés ;
- une estimation indicative du coût de la requête.

L’estimation du coût est calculée dans :

```txt
lib/ai/estimate-ai-cost.ts
```

---

## Module 7 — Scoring par rapport au profil candidat

Le septième module ajoute un score de compatibilité entre chaque offre et un profil candidat statique.

L’objectif n’est pas de laisser le LLM décider si une offre est bonne ou mauvaise. Le LLM sert d’abord à extraire des informations structurées depuis l’offre, comme le niveau estimé, la politique remote, les signaux positifs ou les points de vigilance. Le score final est ensuite calculé par du code TypeScript explicite.

Cette approche permet d’avoir un système de recommandation simple, explicable et contrôlable.

### Profil candidat

Le profil candidat est défini dans :

```txt
lib/profile/candidate-profile.ts
```

Il contient notamment :

- rôle cible ;
- niveau recherché ;
- compétences maîtrisées ;
- compétences en apprentissage ;
- types de contrat préférés ;
- préférences remote ;
- localisations préférées.

Le profil utilisé pour calculer le score est visible dans l’application :

```txt
/profile
```

### Scoring

Le scoring est implémenté dans :

```txt
lib/scoring/score-job-offer.ts
```

Les critères pris en compte sont :

- compétences demandées dans l’offre ;
- niveau estimé du poste ;
- politique remote ;
- points de vigilance détectés par l’analyse IA ;
- signaux positifs détectés par l’analyse IA ;
- type de contrat ;
- localisation ;
- présence d’un salaire ;
- qualité des données scrapées ;
- présence ou absence d’une analyse IA.

Chaque score contient :

- score brut ;
- score maximum ;
- pourcentage ;
- label qualitatif ;
- explications positives ;
- points de vigilance.

Exemples de labels :

- Excellent match
- Bon match
- Match moyen
- Faible compatibilité

Les offres sont triées par score de compatibilité dans :

```txt
/offers
```

Le détail du score est visible dans :

```txt
/offers/[id]
```

### Pourquoi le scoring n’est pas confié entièrement au LLM ?

Le LLM est utile pour transformer du texte libre en données structurées. En revanche, la décision de scoring est plus fiable si elle est écrite en TypeScript avec des règles lisibles.

Le fonctionnement actuel est donc :

```txt
LLM
→ extrait les informations depuis l’offre

TypeScript
→ compare ces informations au profil candidat
→ calcule un score
→ explique le résultat
```

Cela rend le système :

- plus prévisible ;
- plus simple à tester ;
- plus facile à modifier ;
- plus défendable en entretien.

### Script de test

Le scoring peut être testé hors interface avec :

```bash
npm run score:test
```

---

## Module 8 — RAG sur les offres

Le huitième module ajoute une première recherche RAG sur les offres stockées.

Objectif :

```txt
question utilisateur
→ embedding de la question
→ recherche vectorielle avec pgvector
→ récupération des offres pertinentes
→ réponse LLM à partir des sources
```

Le but est de permettre à l’utilisateur de poser des questions en langage naturel sur les offres, sans prétendre que le modèle connaît directement la base de données.

### Fonctionnement général

Chaque offre est transformée en document texte RAG avec :

- les informations principales de l’offre ;
- les compétences détectées ;
- la description ;
- l’analyse IA structurée si elle existe ;
- les signaux positifs ;
- les points de vigilance.

Ce document est ensuite transformé en embedding avec le modèle :

```txt
text-embedding-3-small
```

Les embeddings sont stockés dans PostgreSQL avec l’extension `pgvector`.

Quand l’utilisateur pose une question, l’application :

1. génère l’embedding de la question ;
2. compare cet embedding avec ceux des offres ;
3. récupère les offres les plus proches ;
4. injecte ces offres comme sources dans le prompt ;
5. demande au LLM de répondre uniquement à partir de ces sources.

### Documents RAG

La transformation d’une offre en document texte est gérée dans :

```txt
lib/rag/job-offer-rag-document.ts
```

L’objectif est de produire un texte propre et stable, par exemple :

```txt
Titre : Développeur Frontend React Junior
Entreprise : Atelier Nova
Lieu : Nancy
Type de contrat : CDI
Remote : Oui
Compétences détectées : React, Next.js, TypeScript

Résumé de l'analyse précédente :
...

Description :
...
```

Ce document est la matière première du RAG.

### Embeddings

La génération d’embeddings est gérée dans :

```txt
lib/rag/generate-embedding.ts
```

Le projet utilise le provider OpenAI explicite via :

```ts
openai.embeddingModel("text-embedding-3-small")
```

Cela permet d’utiliser directement la variable serveur :

```env
OPENAI_API_KEY="your_api_key_here"
```

### pgvector

Le projet utilise une image PostgreSQL compatible pgvector :

```yaml
image: pgvector/pgvector:pg17-trixie
```

L’extension doit être activée en base :

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Le modèle Prisma utilise un champ vectoriel défini avec :

```prisma
embedding Unsupported("vector(1536)")
```

Le nombre `1536` correspond au nombre de dimensions du modèle `text-embedding-3-small`.

### Modèle d’embedding

Le modèle Prisma ajouté est :

```prisma
model JobOfferEmbedding {
  id String @id @default(cuid())

  jobOfferId String   @unique
  jobOffer   JobOffer @relation(fields: [jobOfferId], references: [id], onDelete: Cascade)

  content String
  embedding Unsupported("vector(1536)")

  modelName String @default("text-embedding-3-small")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([jobOfferId])
}
```

Chaque offre peut avoir un embedding associé.

La relation inverse existe dans `JobOffer` :

```prisma
embedding JobOfferEmbedding?
```

### Stockage des embeddings

La création ou mise à jour d’un embedding d’offre est gérée dans :

```txt
lib/rag/create-job-offer-embedding.ts
```

Prisma ne manipule pas directement le type `vector(1536)` comme un tableau JavaScript classique. Le projet utilise donc du SQL brut via Prisma pour insérer ou mettre à jour le vecteur.

Le tableau JavaScript est converti au format pgvector :

```ts
const embeddingSql = `[${embedding.join(",")}]`;
```

Puis inséré avec un cast SQL :

```sql
::vector
```

### Recherche vectorielle

La recherche vectorielle est implémentée dans :

```txt
lib/rag/search-job-offers.ts
```

Elle fonctionne ainsi :

```txt
question utilisateur
→ embedding de la question
→ comparaison avec les embeddings stockés
→ récupération des offres les plus proches
```

La comparaison utilise l’opérateur pgvector :

```sql
<=>
```

Cet opérateur permet de calculer une distance cosinus entre deux vecteurs.

Plus la distance est faible, plus le document est proche sémantiquement de la question.

### Réponse RAG

La génération de réponse est implémentée dans :

```txt
lib/rag/answer-question-about-offers.ts
```

Le flux est :

```txt
question
→ recherche vectorielle
→ sources pertinentes
→ prompt avec contexte
→ réponse LLM
→ sources utilisées
```

Le system prompt impose plusieurs règles :

- répondre uniquement à partir des sources fournies ;
- ne pas inventer d’offres, d’entreprises, de salaires ou de conditions ;
- dire quand les sources ne permettent pas de répondre clairement ;
- répondre en français ;
- citer les sources utilisées avec un format du type `[Source 1]`.

### Page disponible

La page RAG est disponible ici :

```txt
/rag
```

Elle permet de poser une question en langage naturel sur les offres indexées.

Elle affiche aussi :

- le nombre total d’offres ;
- le nombre d’offres indexées pour le RAG ;
- le nombre d’embeddings manquants ;
- la réponse générée ;
- les sources utilisées ;
- la distance vectorielle de chaque source ;
- un lien vers la page détail de chaque offre source.

### Statistiques de l’index RAG

Les statistiques de l’index sont récupérées avec :

```txt
lib/rag/get-rag-index-stats.ts
```

Cela permet d’afficher dans `/rag` :

```txt
Offres totales
Offres indexées RAG
Embeddings manquants
```

Cette information est importante car le RAG dépend explicitement d’un index vectoriel. Si aucune offre n’est indexée, la recherche RAG ne peut pas produire de sources utiles.

### Scripts RAG utiles

Vérifier l’état de l’index RAG :

```bash
npm run rag:check-embeddings
```

Générer les embeddings manquants avec une limite par défaut :

```bash
npm run rag:generate-missing-embeddings
```

Générer seulement 2 embeddings manquants :

```bash
npm run rag:generate-missing-embeddings -- --limit=2
```

Tester la recherche vectorielle seule :

```bash
npm run rag:search
```

Tester la réponse RAG complète :

```bash
npm run rag:answer
```

### Scripts pédagogiques ou de debug

Certains scripts peuvent être conservés pendant l’apprentissage :

```txt
rag:test-document
rag:test-db-documents
rag:test-embedding
rag:create-one-embedding
rag:generate-some-embeddings
```

Ils ont servi à valider progressivement :

```txt
document RAG
→ embedding unique
→ stockage d’un embedding
→ génération de quelques embeddings
→ recherche vectorielle
→ réponse RAG
```

À terme, ils peuvent être rangés, renommés ou retirés si le projet est préparé pour une démonstration portfolio.

### Garde-fous RAG

Le RAG ne remplace pas la base de données.

Le modèle ne connaît pas directement les offres. L’application récupère d’abord les sources pertinentes, puis les transmet au LLM.

Le système demande au modèle de :

- répondre uniquement à partir des sources fournies ;
- ne pas inventer d’offre, de salaire ou de condition ;
- citer les sources utilisées ;
- dire quand les sources ne suffisent pas.

Le RAG actuel reste volontairement simple :

- pas de chat multi-message ;
- pas de streaming ;
- pas d’agent ;
- pas de génération massive incontrôlée ;
- pas d’action automatique sensible.

---

## Modèles Prisma actuels

Le projet contient notamment :

- `JobOffer`
- `ScrapingRun`
- `JobAnalysis`
- `JobOfferEmbedding`

### JobOffer

Représente une offre d’emploi stockée en base.

Champs importants :

- `title`
- `company`
- `location`
- `contractType`
- `remote`
- `skills`
- `description`
- `source`
- `url`
- `scrapedAt`
- `qualityScore`
- `qualityIssues`
- `createdAt`
- `updatedAt`

Le champ `url` est unique.

Relations principales :

- une offre peut avoir une analyse IA ;
- une offre peut avoir un embedding RAG ;
- une offre peut être liée à une session de scraping.

### ScrapingRun

Représente une session de scraping ou d’import.

Champs importants :

- `source`
- `status`
- `offersCount`
- `startedAt`
- `finishedAt`
- `errorMessage`

Cela permet de tracer les imports.

### JobAnalysis

Représente une analyse IA associée à une offre.

Champs importants :

- `jobOfferId`
- `summary`
- `requiredSkills`
- `niceToHaveSkills`
- `experienceLevel`
- `remotePolicy`
- `salaryMentioned`
- `redFlags`
- `positiveSignals`
- `analysisMode`
- `modelName`
- `inputTokens`
- `outputTokens`
- `totalTokens`
- `createdAt`
- `updatedAt`

Pour l’instant :

```txt
une offre = une analyse IA maximum
```

La relation est assurée avec :

```txt
jobOfferId unique
```

### JobOfferEmbedding

Représente le document RAG et l’embedding associés à une offre.

Champs importants :

- `jobOfferId`
- `content`
- `embedding`
- `modelName`
- `createdAt`
- `updatedAt`

Pour l’instant :

```txt
une offre = un embedding maximum
```

La relation est assurée avec :

```txt
jobOfferId unique
```

---

## Pages disponibles

### Liste des offres

```txt
/offers
```

Affiche les offres stockées en base PostgreSQL.

Les offres sont enrichies avec un score de compatibilité et triées par pertinence.

### Détail d’une offre

```txt
/offers/[id]
```

Affiche :

- les informations principales de l’offre ;
- la description ;
- le score profil détaillé ;
- les explications positives du score ;
- les points de vigilance du score ;
- l’analyse IA si elle existe ;
- les compétences requises ;
- les compétences bonus ;
- les signaux positifs ;
- les points de vigilance ;
- les métadonnées IA ;
- un bouton pour générer ou relancer l’analyse.

### Profil candidat

```txt
/profile
```

Affiche le profil utilisé pour calculer le score des offres.

### Recherche RAG

```txt
/rag
```

Permet de poser une question en langage naturel sur les offres indexées.

Affiche :

- les statistiques de l’index RAG ;
- la réponse générée ;
- les sources utilisées ;
- les distances vectorielles ;
- les liens vers les offres sources.

### Historique des imports

```txt
/scraping-runs
```

Affiche les dernières sessions d’import.

### Dashboard qualité

```txt
/data-quality
```

Affiche les statistiques de qualité des données.

### Page dynamique fictive

```txt
/fake-dynamic-jobs
```

Sert à tester le scraping dynamique avec Playwright.

---

## Installation du projet

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer les variables d’environnement

Copier `.env.example` vers `.env.local`.

Exemple :

```env
DATABASE_URL="postgresql://jobradar:jobradar_password@localhost:5432/jobradar"
OPENAI_API_KEY="your_api_key_here"
USE_FAKE_AI=true
USE_FAKE_SCRAPER=true
```

Ne jamais committer :

```txt
.env
.env.local
```

Le dépôt doit seulement contenir :

```txt
.env.example
```

---

## Lancer PostgreSQL en local

Le projet utilise Docker Compose.

Le service PostgreSQL doit utiliser une image compatible pgvector :

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg17-trixie
    container_name: jobradar-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: jobradar
      POSTGRES_PASSWORD: jobradar_password
      POSTGRES_DB: jobradar
    ports:
      - "5432:5432"
    volumes:
      - jobradar_postgres_data:/var/lib/postgresql/data

volumes:
  jobradar_postgres_data:
```

Commande :

```bash
docker compose up -d
```

Vérifier que le conteneur tourne :

```bash
docker ps
```

PostgreSQL est accessible sur :

```txt
localhost:5432
```

### Activer pgvector

Entrer dans PostgreSQL :

```bash
docker exec -it jobradar-postgres psql -U jobradar -d jobradar
```

Activer l’extension :

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Vérifier :

```sql
SELECT extname FROM pg_extension WHERE extname = 'vector';
```

Quitter :

```sql
\q
```

---

## Prisma

### Générer le client Prisma

```bash
npm run db:generate
```

Ou directement :

```bash
npx prisma generate
```

### Lancer les migrations

```bash
npm run db:migrate
```

Ou directement :

```bash
npx prisma migrate dev
```

### Ouvrir Prisma Studio

```bash
npm run db:studio
```

Ou directement :

```bash
npx prisma studio
```

### Important après modification du schema Prisma

Après une migration ou une modification de relation, relancer :

```bash
npx prisma generate
```

Puis redémarrer le serveur Next.js :

```bash
Ctrl + C
npm run dev
```

Si le cache Next pose problème sous PowerShell :

```powershell
Remove-Item .next -Recurse -Force
npm run dev
```

---

## Scripts disponibles

### Lancer le serveur Next.js

```bash
npm run dev
```

### Lancer le build

```bash
npm run build
```

### Scraping statique

```bash
npm run scrape:static
```

Génère :

```txt
data/scraped-jobs.json
```

### Scraping dynamique

```bash
npm run scrape:dynamic
```

Génère :

```txt
data/dynamic-scraped-jobs.json
```

### Importer les offres JSON en base

```bash
npm run db:import:scraped
```

Ce script :

- lit les fichiers JSON ;
- nettoie les offres ;
- déduplique les offres ;
- analyse la qualité ;
- crée une ligne `ScrapingRun` ;
- insère ou met à jour les offres avec `upsert` ;
- stocke `qualityScore` et `qualityIssues`.

### Ouvrir Prisma Studio

```bash
npm run db:studio
```

### Scripts de test IA

```bash
npm run ai:test
npm run ai:test:save
```

Ces scripts servent à tester l’analyse IA hors interface.

### Script de test scoring

```bash
npm run score:test
```

Ce script sert à tester le scoring hors interface.

### Scripts RAG

Vérifier l’état de l’index RAG :

```bash
npm run rag:check-embeddings
```

Générer les embeddings manquants :

```bash
npm run rag:generate-missing-embeddings
```

Générer un nombre limité d’embeddings manquants :

```bash
npm run rag:generate-missing-embeddings -- --limit=2
```

Tester la recherche vectorielle :

```bash
npm run rag:search
```

Tester la réponse RAG complète :

```bash
npm run rag:answer
```

---

## Pipeline de développement local

Pour lancer l’application :

```bash
docker compose up -d
npm run dev
```

Pour refaire tout le pipeline de données :

```bash
npm run scrape:static
npm run scrape:dynamic
npm run db:import:scraped
```

Puis consulter :

```txt
http://localhost:3000/offers
http://localhost:3000/profile
http://localhost:3000/rag
http://localhost:3000/scraping-runs
http://localhost:3000/data-quality
```

Pour préparer le RAG après import des offres :

```bash
npm run rag:check-embeddings
npm run rag:generate-missing-embeddings
```

Puis tester :

```txt
http://localhost:3000/rag
```

---

## Tester l’analyse IA

### En fake mode

Dans `.env.local` :

```env
USE_FAKE_AI=true
```

Puis :

```bash
npm run dev
```

Sur une page détail :

```txt
/offers/[id]
```

Cliquer sur :

```txt
Analyser avec IA fake
```

### En mode réel

Dans `.env.local` :

```env
USE_FAKE_AI=false
```

Redémarrer le serveur :

```bash
Ctrl + C
npm run dev
```

Puis relancer l’analyse sur une seule offre.

Repasser ensuite en fake mode pour éviter les appels involontaires :

```env
USE_FAKE_AI=true
```

---

## Tester le RAG

Le RAG nécessite des embeddings stockés en base.

### 1. Vérifier l’état de l’index

```bash
npm run rag:check-embeddings
```

### 2. Générer les embeddings manquants

```bash
npm run rag:generate-missing-embeddings
```

Ou avec une limite :

```bash
npm run rag:generate-missing-embeddings -- --limit=2
```

### 3. Tester la recherche vectorielle seule

```bash
npm run rag:search
```

### 4. Tester la réponse RAG complète

```bash
npm run rag:answer
```

### 5. Tester dans l’interface

Lancer l’application :

```bash
npm run dev
```

Puis ouvrir :

```txt
http://localhost:3000/rag
```

Exemple de question :

```txt
Quelles offres sont adaptées à un développeur React junior qui veut du télétravail ?
```

---

## Variables d’environnement

Exemple de `.env.example` :

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME"
OPENAI_API_KEY="your_api_key_here"
USE_FAKE_AI=true
USE_FAKE_SCRAPER=true
```

Variables principales :

```txt
DATABASE_URL
→ connexion PostgreSQL

OPENAI_API_KEY
→ clé API OpenAI côté serveur uniquement

USE_FAKE_AI
→ true pour fake mode, false pour vrai appel LLM

USE_FAKE_SCRAPER
→ réservé aux futurs tests autour du scraping
```

---

## Sécurité et garde-fous

Le projet respecte plusieurs règles :

- ne pas committer `.env` ou `.env.local` ;
- ne pas exposer de clé API côté frontend ;
- ne pas appeler automatiquement l’IA sur toutes les offres ;
- déclencher l’analyse IA manuellement ;
- stocker les analyses pour éviter les appels répétés ;
- afficher le mode fake ou réel dans l’interface ;
- afficher les tokens consommés ;
- estimer le coût de la requête ;
- générer les embeddings avec des scripts contrôlés ;
- éviter les appels API massifs ;
- ne pas scraper de sources sensibles au début ;
- éviter LinkedIn, Indeed, Google Jobs, Instagram et les sites avec login ;
- travailler d’abord sur des pages fictives ou contrôlées ;
- garder les futures actions d’agent sous contrôle humain.

---

## Sources de données

Pour l’instant, les sources sont fictives ou locales.

Cela permet d’apprendre :

- la structure d’un scraper ;
- l’extraction de données ;
- les limites de Cheerio ;
- l’usage de Playwright ;
- la transformation des données ;
- le stockage en base ;
- l’analyse IA structurée ;
- le scoring profil ;
- le fonctionnement du RAG ;

sans dépendre de sites externes, de protections anti-bot ou de conditions d’utilisation complexes.

---

## Choix techniques importants

### Next.js App Router

Le projet utilise Next.js avec App Router pour apprendre une structure moderne d’application React fullstack.

### Server Components et Server Actions

Les pages lisent les données côté serveur.

Les actions sensibles, comme l’analyse IA ou la réponse RAG, passent par une Server Action afin de garder côté serveur :

- Prisma ;
- OpenAI ;
- variables d’environnement ;
- logique métier.

### Cheerio avant Playwright

Cheerio a été utilisé d’abord parce qu’il est plus simple pour comprendre :

- le HTML ;
- le DOM ;
- les sélecteurs CSS ;
- l’extraction de texte.

### Playwright ensuite

Playwright a été ajouté pour gérer les pages dynamiques qui chargent leur contenu avec JavaScript.

### PostgreSQL + Prisma

PostgreSQL a été choisi pour préparer une base solide avant les futures étapes IA et RAG.

Prisma apporte :

- migrations ;
- typage TypeScript ;
- client de base de données ;
- relations ;
- `upsert`.

### pgvector pour le RAG

pgvector permet de stocker et comparer des embeddings directement dans PostgreSQL.

Cela évite d’ajouter une base vectorielle séparée au début du projet.

Le flux actuel est :

```txt
texte d’offre
→ embedding OpenAI
→ stockage PostgreSQL pgvector
→ recherche par similarité
```

### Zod pour les structured outputs

Zod permet de définir un schéma de sortie attendu pour l’analyse IA.

L’objectif est d’éviter d’utiliser directement une réponse libre du LLM.

Le flux est :

```txt
LLM
→ objet structuré
→ validation Zod
→ stockage PostgreSQL
→ affichage UI
```

### Mode fake IA

Le fake mode permet de tester le pipeline sans consommer l’API.

Il est utile pour :

- développer l’UI ;
- tester les Server Actions ;
- éviter les coûts inutiles ;
- travailler sans clé API.

### Scoring TypeScript explicable

Le scoring n’est pas confié entièrement au LLM.

Le LLM extrait des données structurées, puis le code TypeScript applique des règles métier explicites. Cela rend le score plus lisible, plus testable et plus facile à modifier.

### RAG avec sources

Le RAG est conçu pour répondre à partir de sources récupérées.

Le modèle ne connaît pas directement la base de données.

Le fonctionnement est :

```txt
question utilisateur
→ recherche vectorielle
→ sources pertinentes
→ prompt avec contexte
→ réponse avec citations
```

---

## Organisation Git recommandée

Le projet suit une organisation proche d’un workflow professionnel :

```txt
main
→ branche stable et montrable

develop
→ branche d’intégration

feature/...
→ branches de travail par module
```

Exemples :

```txt
feature/module-4-postgresql-prisma
feature/module-5-data-cleaning
feature/module-6-llm-structured-extraction
feature/module-7-profile-scoring
feature/module-8-rag
```

Workflow :

1. partir de `develop`
2. créer une branche `feature`
3. travailler dessus
4. commit régulièrement
5. merger dans `develop` quand le module est stable
6. merger `develop` dans `main` quand la version est montrable

Commandes Git utiles :

```bash
git status
git log --oneline --decorate -5
```

Créer une branche de module :

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nom-du-module
git push -u origin feature/nom-du-module
```

Commit recommandé pour le Module 8 :

```bash
git add .
git commit -m "feat(rag): add job offer semantic search"
git push
```

---

## Roadmap

### Module 1 — Next.js minimum viable

Statut : terminé.

Objectif : créer une interface simple affichant des offres fictives.

### Module 2 — Scraping statique avec Cheerio

Statut : terminé.

Objectif : extraire des offres depuis du HTML local contrôlé.

### Module 3 — Scraping dynamique avec Playwright

Statut : terminé.

Objectif : automatiser un navigateur pour récupérer des données générées par JavaScript.

### Module 4 — PostgreSQL + Prisma

Statut : terminé.

Objectif : stocker les offres en base et les lire depuis l’application.

### Module 5 — Nettoyage, normalisation et dédoublonnage

Statut : terminé.

Objectif : améliorer la qualité des données avant l’analyse IA.

### Module 6 — LLM structured extraction

Statut : terminé.

Objectif : utiliser un LLM pour extraire des informations structurées depuis les offres.

### Module 7 — Scoring par rapport au profil

Statut : terminé.

Objectif : comparer les offres au profil candidat avec un score explicable.

### Module 8 — RAG sur les offres

Statut : terminé.

Objectif : poser des questions en langage naturel sur les offres stockées, avec recherche vectorielle et réponse sourcée.

### Module 9 — Agent avec tools contrôlés

Statut : à venir.

Objectif : créer un agent capable d’utiliser des tools limités et validés.

### Module 10 — Qualité, sécurité, README et portfolio

Statut : à venir.

Objectif : rendre le projet présentable en entretien.

---

## Prochaines étapes techniques

Après le Module 8, la suite logique est le Module 9.

Priorités à venir :

1. expliquer ce qu’est un agent IA ;
2. expliquer ce qu’est un tool ;
3. créer un premier tool de lecture simple, par exemple `searchOffers` ;
4. éviter toute action sensible au début ;
5. logger les appels de tools ;
6. limiter le nombre d’étapes ;
7. demander confirmation humaine avant toute action sensible.

On ne doit pas commencer par un agent autonome complexe.

Le projet doit rester contrôlé, compréhensible et défendable.

---

## Ce que ce projet montre en entretien

Ce projet permet d’expliquer :

- pourquoi commencer avec des données fictives ;
- comment fonctionne le scraping statique ;
- pourquoi Playwright est utile pour les pages dynamiques ;
- pourquoi stocker les données en base ;
- comment éviter les doublons ;
- comment fonctionne Prisma ;
- comment utiliser des migrations ;
- pourquoi nettoyer les données avant de les envoyer à un LLM ;
- comment utiliser un LLM pour produire une sortie structurée ;
- pourquoi valider cette sortie avec Zod ;
- comment stocker une analyse IA en base ;
- comment éviter les appels API inutiles ;
- comment suivre les tokens et estimer les coûts ;
- pourquoi ne pas confier toute la décision au LLM ;
- comment créer un score explicable ;
- ce qu’est un embedding ;
- comment fonctionne pgvector ;
- comment fonctionne une recherche vectorielle ;
- comment fonctionne un RAG avec sources ;
- pourquoi le modèle ne connaît pas directement la base ;
- quelles limites juridiques et techniques existent autour du scraping ;
- comment préparer progressivement une application IA sérieuse.

---

## Limites actuelles

Le projet est encore pédagogique.

Limites connues :

- les sources sont fictives ou locales ;
- les données ne viennent pas encore de vraies APIs ou sources publiques ;
- l’analyse IA dépend fortement de la qualité du prompt ;
- l’estimation de coût est indicative ;
- le scoring est indicatif et dépend du profil statique ;
- il n’y a pas encore de profil utilisateur en base ;
- le RAG fonctionne sur des documents simples, sans chunking avancé ;
- il n’y a pas encore de chat multi-message ;
- il n’y a pas encore de streaming de réponse ;
- il n’y a pas encore d’agent ;
- il n’y a pas encore de gestion utilisateur ;
- il n’y a pas encore de déploiement production finalisé.

Ces limites sont volontaires : le projet avance module par module.

---

## Notes pour le développement

Avec Prisma 7, la configuration est séparée :

```txt
prisma/schema.prisma
→ modèles, enums, relations

prisma.config.ts
→ configuration de la CLI Prisma et DATABASE_URL

lib/prisma.ts
→ PrismaClient utilisé par le code applicatif
```

Le projet utilise aussi un adapter PostgreSQL pour Prisma Client.

Après modification de `schema.prisma`, penser à :

```bash
npx prisma generate
```

Puis redémarrer le serveur Next.js.

Pour les champs pgvector, Prisma utilise :

```prisma
Unsupported("vector(1536)")
```

Les insertions et recherches vectorielles passent donc par du SQL brut Prisma.

---

## Licence

Projet personnel pédagogique et portfolio.

Les données utilisées dans les premiers modules sont fictives ou contrôlées.

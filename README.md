# JobRadar IA

JobRadar IA est un projet pédagogique et portfolio autour du scraping, de la structuration de données et de l’intelligence artificielle appliquée à l’analyse d’offres d’emploi.

L’objectif est de construire progressivement une application capable de :

- récupérer des offres depuis des sources contrôlées ;
- nettoyer, normaliser et dédupliquer les données ;
- stocker les offres dans PostgreSQL ;
- analyser les offres avec un LLM ;
- valider les sorties IA avec Zod ;
- tracer les coûts et les tokens consommés ;
- comparer les offres à un profil candidat ;
- poser des questions sur les offres avec du RAG ;
- utiliser un agent IA avec des tools contrôlés ;
- afficher les tools utilisés par l’agent ;
- garder les actions sensibles sous validation humaine.

Le projet avance module par module afin de rester compréhensible, maintenable et explicable en entretien.

---

## Pipeline actuel

```txt
sources fictives / contrôlées
→ scraping statique ou dynamique
→ export JSON temporaire
→ nettoyage / normalisation / déduplication
→ analyse qualité
→ import PostgreSQL
→ affichage Next.js
→ analyse LLM structurée
→ stockage JobAnalysis
→ scoring profil
→ documents RAG
→ embeddings OpenAI
→ stockage pgvector
→ recherche vectorielle
→ réponse RAG avec sources
→ agent avec tools contrôlés
→ interface Next.js
```

---

## État actuel du projet

Le projet couvre actuellement :

- Module 1 — Next.js minimum viable ;
- Module 2 — Scraping statique avec Cheerio ;
- Module 3 — Scraping dynamique avec Playwright ;
- Module 4 — PostgreSQL + Prisma ;
- Module 5 — Nettoyage, normalisation, déduplication et qualité des données ;
- Module 6 — Analyse LLM structurée avec Zod et OpenAI ;
- Module 7 — Scoring par rapport au profil candidat ;
- Module 8 — RAG sur les offres avec embeddings et pgvector ;
- Module 9 — Agent avec tools contrôlés ;
- Passe qualité — refactor ciblé, lint, build et premiers tests unitaires.

L’agent actuel peut rechercher des offres et consulter le détail d’une offre. Il ne peut pas envoyer de mail, postuler automatiquement, modifier la base, supprimer des données ou lancer un scraping.

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
- ce qu’est un agent IA ;
- ce qu’est un tool ;
- comment un LLM peut appeler des fonctions applicatives ;
- comment limiter, tracer et sécuriser un agent ;
- comment ajouter des tests unitaires sur des fonctions pures ;
- comment construire un projet présentable en entretien.

Le projet a été construit comme support d’apprentissage avec assistance IA. L’objectif est de comprendre, savoir expliquer, savoir modifier et savoir défendre les choix techniques.

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
- Tool calling
- Agent avec tools contrôlés
- Mode fake IA avec `USE_FAKE_AI`
- Stockage des analyses IA en base
- Suivi des tokens consommés
- Estimation indicative du coût par requête

### Qualité

- ESLint
- Vitest
- Tests unitaires sur fonctions pures
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
│  │
│  ├─ profile/
│  │  └─ page.tsx
│  │
│  ├─ rag/
│  │  ├─ page.tsx
│  │  └─ actions.ts
│  │
│  ├─ agent/
│  │  ├─ page.tsx
│  │  ├─ actions.ts
│  │  └─ AgentQuestionForm.tsx
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
│  ├─ offers/
│  │  ├─ OfferCard.tsx
│  │  ├─ OfferList.tsx
│  │  └─ OfferFilters.tsx
│  │
│  └─ rag/
│     └─ RagQuestionForm.tsx
│
├─ lib/
│  ├─ ai/
│  │  ├─ analyze-and-save-job-offer.ts
│  │  ├─ analyze-job-offer.ts
│  │  ├─ estimate-ai-cost.ts
│  │  ├─ estimate-ai-cost.test.ts
│  │  └─ job-analysis-schema.ts
│  │
│  ├─ offers/
│  │  ├─ get-offers.ts
│  │  ├─ offer-cleaning.ts
│  │  ├─ offer-cleaning.test.ts
│  │  ├─ offer-deduplication.ts
│  │  ├─ offer-deduplication.test.ts
│  │  ├─ offer-normalization.ts
│  │  ├─ offer-normalization.test.ts
│  │  ├─ offer-quality.ts
│  │  ├─ offer-quality.test.ts
│  │  └─ read-scraped-offers.ts
│  │
│  ├─ profile/
│  │  └─ candidate-profile.ts
│  │
│  ├─ scoring/
│  │  └─ score-job-offer.ts
│  │
│  ├─ rag/
│  │  ├─ answer-question-about-offers.ts
│  │  ├─ create-job-offer-embedding.ts
│  │  ├─ generate-embedding.ts
│  │  ├─ get-rag-index-stats.ts
│  │  ├─ job-offer-rag-document.ts
│  │  └─ search-job-offers.ts
│  │
│  ├─ agent/
│  │  ├─ get-offer-details-for-agent.ts
│  │  ├─ job-agent-tools.ts
│  │  ├─ run-job-agent.ts
│  │  ├─ search-offers-for-agent.ts
│  │  └─ summarize-agent-tool-calls.ts
│  │
│  ├─ scraping/
│  │  ├─ dynamic-job-scraper.ts
│  │  ├─ export-dynamic-jobs.ts
│  │  ├─ export-static-jobs.ts
│  │  ├─ static-job-parser.test-data.ts
│  │  └─ static-job-parser.ts
│  │
│  └─ prisma.ts
│
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
│
├─ scripts/
│  ├─ check-job-offer-embeddings.ts
│  ├─ generate-missing-job-offer-embeddings.ts
│  ├─ generate-some-job-offer-embeddings.ts
│  ├─ import-scraped-jobs.ts
│  ├─ test-agent-get-offer-details.ts
│  ├─ test-agent-search-offers.ts
│  ├─ test-analyze-and-save-job-offer.ts
│  ├─ test-cleaning.ts
│  ├─ test-create-job-offer-embedding.ts
│  ├─ test-generate-embedding.ts
│  ├─ test-job-agent.ts
│  ├─ test-job-analysis.ts
│  ├─ test-job-scoring.ts
│  ├─ test-rag-answer.ts
│  ├─ test-rag-document.ts
│  ├─ test-rag-documents-from-db.ts
│  └─ test-rag-search.ts
│
├─ types/
│  ├─ job-offer.ts
│  └─ rag.ts
│
├─ data/
│  ├─ dynamic-scraped-jobs.json
│  └─ scraped-jobs.json
│
├─ debug/
│  └─ .gitkeep
│
├─ docker-compose.yml
├─ prisma.config.ts
├─ .env.example
└─ README.md
```

---

## Pages disponibles

### Liste des offres

```txt
/offers
```

Affiche les offres stockées en base PostgreSQL. Les offres sont enrichies avec un score de compatibilité et triées par pertinence.

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

Permet de poser une question en langage naturel sur les offres indexées. La page affiche les statistiques de l’index, la réponse générée, les sources utilisées, les distances vectorielles et les liens vers les offres sources.

### Agent contrôlé

```txt
/agent
```

Permet de poser une question à un agent IA contrôlé.

L’agent peut actuellement :

- rechercher des offres avec `searchOffers` ;
- consulter le détail d’une offre avec `getOfferDetails`.

Il ne peut pas modifier de données, envoyer de mail, postuler automatiquement ou lancer un scraping.

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

Exemple local :

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

Le dépôt doit seulement contenir un exemple sans vraie clé :

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

### Application

```bash
npm run dev
npm run build
npm run start
npm run lint
```

### Qualité et tests

```bash
npm run test
npm run test:watch
npm run check
```

`npm run check` lance :

```txt
tests unitaires
→ lint
→ build Next.js
```

Les tests actuels ciblent volontairement des fonctions pures : nettoyage, normalisation, déduplication, qualité des offres et estimation de coût IA. Les appels Prisma, OpenAI, RAG complet et agent complet ne sont pas encore couverts par des tests automatisés.

### Scraping

```bash
npm run scrape:static
npm run scrape:dynamic
```

Ces scripts génèrent :

```txt
data/scraped-jobs.json
data/dynamic-scraped-jobs.json
```

### Base de données

```bash
npm run db:import:scraped
npm run db:studio
npm run db:migrate
npm run db:generate
```

Le script `db:import:scraped` :

- lit les fichiers JSON ;
- nettoie les offres ;
- déduplique les offres ;
- analyse la qualité ;
- crée une ligne `ScrapingRun` ;
- insère ou met à jour les offres avec `upsert` ;
- stocke `qualityScore` et `qualityIssues`.

### IA structurée

```bash
npm run ai:test
npm run ai:test:save
```

Ces scripts servent à tester l’analyse IA hors interface.

### Scoring

```bash
npm run score:test
```

Ce script sert à tester le scoring hors interface.

### RAG

```bash
npm run rag:check-embeddings
npm run rag:generate-missing-embeddings
npm run rag:generate-missing-embeddings -- --limit=2
npm run rag:search
npm run rag:answer
```

Scripts RAG pédagogiques / développement :

```bash
npm run dev:rag:test-document
npm run dev:rag:test-db-documents
npm run dev:rag:test-embedding
npm run dev:rag:create-one-embedding
npm run dev:rag:generate-some-embeddings
```

### Agent

```bash
npm run agent:test:search
npm run agent:test:details
npm run agent:test
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
http://localhost:3000/agent
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

## Analyse IA structurée

Le module d’analyse IA transforme une description d’offre en objet structuré validé avec Zod.

Flux :

```txt
description d’offre
→ LLM
→ objet structuré
→ validation Zod
→ stockage PostgreSQL
→ affichage dans /offers/[id]
```

L’analyse IA est déclenchée manuellement depuis la page détail d’une offre. Elle n’est pas lancée automatiquement sur toutes les offres.

### Données extraites

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

### Fake mode IA

Dans `.env.local` :

```env
USE_FAKE_AI=true
```

En fake mode :

- pas d’appel OpenAI ;
- pas de consommation de tokens ;
- analyse simulée ;
- pipeline testable localement.

### Mode réel

Dans `.env.local` :

```env
USE_FAKE_AI=false
```

L’application appelle OpenAI via le Vercel AI SDK. La clé API doit rester uniquement côté serveur :

```env
OPENAI_API_KEY="your_api_key_here"
```

---

## Scoring par rapport au profil candidat

Le scoring compare chaque offre à un profil candidat statique.

Le profil est défini dans :

```txt
lib/profile/candidate-profile.ts
```

Le scoring est implémenté dans :

```txt
lib/scoring/score-job-offer.ts
```

Le LLM ne décide pas directement si une offre est bonne ou mauvaise. Il extrait des informations structurées. Le code TypeScript applique ensuite des règles métier explicites.

Critères pris en compte :

- compétences demandées ;
- niveau estimé du poste ;
- politique remote ;
- points de vigilance IA ;
- signaux positifs IA ;
- type de contrat ;
- localisation ;
- présence d’un salaire ;
- qualité des données scrapées ;
- présence ou absence d’une analyse IA.

Cela rend le score plus lisible, plus testable et plus facile à modifier.

---

## RAG sur les offres

Le RAG permet de poser des questions en langage naturel sur les offres stockées.

Flux :

```txt
question utilisateur
→ embedding de la question
→ recherche vectorielle avec pgvector
→ récupération des offres pertinentes
→ réponse LLM à partir des sources
```

Le modèle ne connaît pas directement la base de données. L’application récupère d’abord les sources pertinentes, puis les transmet au LLM.

### Documents RAG

La transformation d’une offre en document texte est gérée dans :

```txt
lib/rag/job-offer-rag-document.ts
```

### Embeddings

La génération d’embeddings est gérée dans :

```txt
lib/rag/generate-embedding.ts
```

Modèle utilisé :

```txt
text-embedding-3-small
```

Le modèle produit des vecteurs de 1536 dimensions.

### pgvector

Le modèle Prisma utilise un champ vectoriel défini avec :

```prisma
embedding Unsupported("vector(1536)")
```

Les insertions et recherches vectorielles passent par du SQL brut Prisma.

### Recherche vectorielle

La recherche vectorielle est implémentée dans :

```txt
lib/rag/search-job-offers.ts
```

Elle utilise l’opérateur pgvector :

```sql
<=>
```

Plus la distance est faible, plus le document est proche sémantiquement de la question.

### Réponse RAG

La génération de réponse est implémentée dans :

```txt
lib/rag/answer-question-about-offers.ts
```

Le system prompt impose plusieurs règles :

- répondre uniquement à partir des sources fournies ;
- ne pas inventer d’offres, d’entreprises, de salaires ou de conditions ;
- dire quand les sources ne permettent pas de répondre clairement ;
- répondre en français ;
- citer les sources utilisées avec un format du type `[Source 1]`.

---

## Agent avec tools contrôlés

Le module agent ajoute un assistant capable d’utiliser certaines fonctions de l’application comme tools.

L’objectif n’est pas de créer un agent autonome libre. L’objectif est de comprendre le tool calling et de construire un assistant limité, traçable et sécurisé.

Flux :

```txt
question utilisateur
→ LLM
→ choix éventuel d’un tool
→ exécution du tool côté serveur
→ retour du résultat au LLM
→ réponse finale
→ affichage des tools utilisés
```

### Différence entre RAG et agent

Le RAG cherche toujours des sources avant de répondre :

```txt
question
→ recherche vectorielle
→ sources
→ LLM
→ réponse
```

L’agent peut décider d’utiliser un tool selon la demande :

```txt
question
→ LLM
→ tool si nécessaire
→ résultat du tool
→ LLM
→ réponse
```

### Tools disponibles

```txt
searchOffers
getOfferDetails
```

`searchOffers` recherche des offres dans la base.

`getOfferDetails` récupère le détail d’une offre à partir de son identifiant.

Les deux tools sont en lecture seule.

### Garde-fous agent

- tools de lecture uniquement ;
- aucun envoi de mail ;
- aucune candidature automatique ;
- aucune suppression ou modification de données ;
- aucun scraping lancé par l’agent ;
- inputs de tools validés avec Zod ;
- nombre d’étapes limité ;
- tools utilisés affichés à l’utilisateur ;
- fake mode IA possible avec `USE_FAKE_AI`.

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
→ true pour fake mode, false pour vrai appel LLM ou agent

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
- limiter les agents à des tools contrôlés ;
- afficher les tools utilisés par l’agent ;
- ne pas donner de tool sensible à l’agent sans validation humaine ;
- ne pas scraper de sources sensibles au début ;
- éviter LinkedIn, Indeed, Google Jobs, Instagram et les sites avec login ;
- travailler d’abord sur des pages fictives ou contrôlées ;
- garder les futures actions sensibles d’agent sous contrôle humain.

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
- le fonctionnement du tool calling ;
- la mise en place d’un agent contrôlé ;

sans dépendre de sites externes, de protections anti-bot ou de conditions d’utilisation complexes.

---

## Choix techniques importants

### Next.js App Router

Le projet utilise Next.js avec App Router pour apprendre une structure moderne d’application React fullstack.

### Server Components et Server Actions

Les pages lisent les données côté serveur.

Les actions coûteuses ou sensibles, comme l’analyse IA, la réponse RAG ou l’appel agentique, passent par une Server Action afin de garder côté serveur :

- Prisma ;
- OpenAI ;
- variables d’environnement ;
- logique métier.

### Cheerio avant Playwright

Cheerio a été utilisé d’abord parce qu’il est plus simple pour comprendre le HTML, le DOM, les sélecteurs CSS et l’extraction de texte.

Playwright a ensuite été ajouté pour gérer les pages dynamiques qui chargent leur contenu avec JavaScript.

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

### Zod pour les structured outputs et les tools

Zod permet de définir un schéma de sortie attendu pour l’analyse IA et un schéma d’entrée attendu pour les tools agent.

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

### Tests unitaires sur fonctions pures

Les premiers tests automatisés ciblent les fonctions déterministes du pipeline :

- nettoyage de texte et d’URL ;
- normalisation des contrats, skills et remote ;
- déduplication ;
- analyse qualité ;
- estimation du coût IA.

Les parties qui dépendent de services externes ou de la base de données restent testées via des scripts manuels pour l’instant.

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

Workflow :

1. partir de `develop` ;
2. créer une branche `feature` ;
3. travailler dessus ;
4. commit régulièrement ;
5. merger dans `develop` quand le module est stable ;
6. merger `develop` dans `main` quand la version est montrable.

Commandes Git utiles :

```bash
git status
git log --oneline --decorate -5
```

Avant de merger une version montrable :

```bash
npm run check
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

Statut : terminé.

Objectif : créer un agent capable d’utiliser des tools limités et validés.

### Passe qualité — Refactor ciblé et tests

Statut : terminé.

Objectif : nettoyer certains fichiers, centraliser les types RAG, corriger lint/build, installer Vitest et ajouter les premiers tests unitaires.

### Module 10 — Qualité, sécurité, README et portfolio

Statut : en cours / à poursuivre.

Objectif : rendre le projet plus présentable, documenté et défendable en entretien.

---

## Prochaines étapes possibles

Priorités raisonnables pour la suite :

1. préparer une courte démo du projet ;
2. ajouter quelques captures d’écran ;
3. préparer un schéma d’architecture ;
4. améliorer l’UI des pages principales ;
5. tester le scoring avec quelques cas métier supplémentaires ;
6. ajouter une génération de brouillon de candidature sans envoi automatique ;
7. préparer un déploiement ;
8. réfléchir à des sources de données réelles mais autorisées.

À éviter pour l’instant :

- agent autonome libre ;
- envoi automatique de candidatures ;
- scraping agressif de sites sensibles ;
- refactor massif sans objectif clair ;
- ajout de features IA sans garde-fous.

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
- ce qu’est un agent IA ;
- ce qu’est un tool ;
- comment un LLM peut appeler une fonction applicative ;
- pourquoi limiter les tools disponibles ;
- comment tracer les tools utilisés ;
- comment ajouter progressivement des tests unitaires ;
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
- l’agent actuel est limité à des tools de lecture ;
- l’agent n’a pas encore de mémoire conversationnelle ;
- l’agent ne génère pas encore de brouillon de candidature ;
- les tests automatisés couvrent surtout les fonctions pures ;
- les flows Prisma, OpenAI, RAG complet et agent complet sont encore testés surtout par scripts ;
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

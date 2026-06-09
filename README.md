# JobRadar IA

JobRadar IA est un projet pédagogique et portfolio autour de la veille d’offres d’emploi, du scraping/import de données, de PostgreSQL, du scoring, du RAG et de l’intelligence artificielle appliquée au développement web.

L’objectif est de construire progressivement une application capable de :

- récupérer ou importer des offres depuis des sources contrôlées, des exports externes et des actors Apify ;
- nettoyer, normaliser et dédupliquer les données ;
- stocker les offres dans PostgreSQL avec Prisma ;
- analyser les offres avec un LLM en sorties structurées validées avec Zod ;
- comparer les offres à un profil candidat ;
- interroger les offres avec du RAG ;
- utiliser un agent avec tools contrôlés ;
- générer un rapport Markdown de veille ;
- préparer ensuite des profils/scénarios de recherche, des analyses IA contrôlées, une orchestration Apify plus dynamique et une UI de pilotage.

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
→ rapport Markdown de veille
→ profils candidat + scénarios de recherche
→ analyse IA contrôlée
→ RAG profil/CV/offres
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
- agent avec tools contrôlés ;
- import externe depuis JSON / dataset / actors Apify ;
- mappers source-specific Indeed et LinkedIn ;
- format pivot `ExternalJobOffer` ;
- interface `/offers` adaptée à un vrai volume d’offres ;
- pagination serveur, filtres, tri et responsive mobile-first ;
- rapport Markdown local de veille ;
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
analyse IA manuelle ou contrôlée
↓
rapport Markdown de veille
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
- RAG
- Tool calling
- Agent avec tools contrôlés
- Mode fake IA avec `USE_FAKE_AI`

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
│  │  └─ page.tsx
│  └─ agent/
│     └─ page.tsx
│
├─ components/
│  ├─ layout/
│  │  └─ Nav.tsx
│  └─ offers/
│     ├─ OfferCard.tsx
│     ├─ OfferList.tsx
│     └─ OfferFilters.tsx
│
├─ lib/
│  ├─ ai/
│  ├─ agent/
│  ├─ embeddings/
│  ├─ imports/
│  ├─ offers/
│  ├─ profile/
│  ├─ rag/
│  ├─ scoring/
│  ├─ scraping/
│  ├─ sources/
│  └─ prisma.ts
│
├─ scripts/
│  ├─ import-scraped-jobs.ts
│  ├─ preview-external-import.ts
│  ├─ import-external-offers.ts
│  ├─ generate-jobradar-report.ts
│  ├─ test-job-analysis.ts
│  ├─ test-analyze-and-save-job-offer.ts
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

- embeddings ;
- pgvector ;
- recherche vectorielle ;
- topK ;
- contexte injecté ;
- réponse avec sources.

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
- champs source V2 :
  - `sourceProvider`
  - `sourceName`
  - `sourceActor`
  - `sourceTags`
  - `rawData`
- mappers :
  - `mapIndeedApifyOffer`
  - `mapLinkedinApifyOffer`
- dispatcher :
  - `mapExternalRawItem`
- loader JSON :
  - `JsonFileExternalRawItemsLoader`
- contrats communs :
  - `ExternalRawItemsLoadResult`
  - `ExternalRawItemsLoader`
- factory :
  - `createExternalRawItemsLoader`
- pipeline :
  - `prepareExternalOfferForImport`
  - `previewExternalJobOffersImport`
  - `deduplicatePreparedExternalOffers`
  - `prepareExternalOfferForDb`
- import centralisé :
  - `importExternalJobOffersToDb`
- scripts :
  - `preview-external-import.ts`
  - `import-external-offers.ts`

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

Le rapport contient :

- résumé global ;
- mode rapport ;
- nombre total d’offres ;
- nombre d’offres réelles ;
- derniers imports ;
- offres récentes ;
- offres les plus prometteuses selon scoring ;
- offres à analyser avec IA en priorité ;
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
- quelles offres analyser avec IA ;
- quelles sources posent problème ;
- quelles actions faire ensuite.
```

---

## Prochains modules

### Module 14 — Profils candidat et scénarios de recherche en base

Statut : prochain module.

Objectif : sortir le profil candidat du hardcoding TypeScript et préparer plusieurs scénarios de recherche.

Distinction retenue :

```txt
CandidateProfile
= qui je suis professionnellement
= compétences, niveau, préférences générales, points forts, points faibles

SearchScenario
= ce que je cherche dans un contexte donné
= zone géographique, type de poste, remote, contrats, mots-clés, paramètres source
```

Exemples :

```txt
CandidateProfile par défaut
→ Pierre — Fullstack JS/TS junior

SearchScenario par défaut
→ Grand Est — développeur fullstack / backend JS

Autre scénario possible
→ Brest — développeur fullstack / backend JS

Autre scénario possible
→ Full remote — React / Node / TypeScript
```

Approche initiale :

- modèles Prisma ;
- seed du profil par défaut ;
- seed du scénario Grand Est ;
- helpers de lecture :
  - `getDefaultCandidateProfile()`
  - `getDefaultSearchScenario()`
  - `getActiveSearchContext()`
- branchement progressif du rapport sur le profil/scénario DB ;
- UI de gestion reportée à la fin, mais prévue.

---

### Module 15 — Priorisation heuristique des offres

Statut : à venir.

Objectif : déterminer quelles offres méritent d’être analysées avec IA sans consommer directement l’API.

Approche :

```txt
offres réelles non analysées
→ profil/scénario actif
→ score de priorité déterministe
→ raisons positives
→ warnings
→ sélection top N
→ rapport
```

---

### Module 16 — Analyse IA contrôlée par budget et limite

Statut : à venir.

Objectif : analyser seulement les offres prioritaires.

Approche :

```txt
offres candidates
→ dry-run
→ estimation coût
→ limite max par run
→ confirmation explicite
→ analyse IA
→ stockage
→ rapport
```

Commande cible possible :

```bash
npm run ai:analyze-candidates -- --scenario=default --limit=5 --dry-run
npm run ai:analyze-candidates -- --scenario=default --limit=5 --run
```

---

### Module 17 — RAG profil/CV/offres

Statut : à venir.

Objectif : enrichir le RAG avec le profil candidat, le CV et les offres.

Approche initiale :

- garder le CV en Markdown ;
- ajouter un document profil/CV comme source RAG ;
- utiliser ces documents pour les analyses personnalisées ;
- préparer la génération de brouillons de candidature.

---

### Module 18 — Presets Apify dynamiques et interface de lancement

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

### Module 19 — UI de pilotage

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

### Module 20 — Distribution du rapport

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
- `/rag` : interface RAG.
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
```

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
- afficher les tokens consommés ;
- estimer le coût des requêtes IA ;
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

Commit du module reporting :

```bash
git add .
git commit -m "feat(reporting): generate job watch markdown report"
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
- comment préparer une application IA sérieuse avec contrôle humain.

---

## Limites actuelles

Le projet reste pédagogique et personnel.

Limites connues :

- les imports réels dépendent des actors et exports externes ;
- un actor Apify ne rend pas automatiquement une source juridiquement autorisée ;
- les mappers doivent être maintenus source par source ;
- le scoring dépend encore d’un profil principalement codé en dur ;
- les profils/scénarios ne sont pas encore stockés en base ;
- l’analyse IA automatique contrôlée n’est pas encore implémentée ;
- le RAG profil/CV/offres reste à enrichir ;
- l’UI de pilotage V2 reste à construire ;
- la distribution du rapport n’est pas encore faite.

Ces limites sont volontaires : le projet avance module par module.

---

## Licence

Projet personnel pédagogique et portfolio.

Les données utilisées dans les premiers modules sont fictives ou contrôlées. Les imports externes et actors Apify sont utilisés avec prudence, dans une logique d’apprentissage, de traçabilité et de contrôle des coûts.

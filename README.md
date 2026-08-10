# JobRadar IA

JobRadar IA est une application fullstack de veille d’offres d’emploi qui combine **collecte de données, scoring explicable, analyse LLM, RAG, reporting et automatisation**.

Le projet a commencé comme support d’apprentissage autour de Next.js, PostgreSQL et de l’IA appliquée au web, puis a évolué vers une V2 déployée et utilisable pour une veille réelle.

## Fonctionnalités principales

- Import d’offres depuis des actors Apify pour Indeed, LinkedIn et Meteojob.
- Génération dynamique des recherches à partir d’un profil et d’un scénario de recherche.
- Nettoyage, normalisation et déduplication avant stockage.
- Préfiltre déterministe pour écarter les offres manifestement hors cible.
- Historisation des campagnes, runs et événements d’import.
- Scoring de compatibilité explicable avec points positifs et points de vigilance.
- Priorisation métier des offres.
- Analyse LLM structurée et validée avec Zod.
- RAG générique basé sur PostgreSQL + pgvector.
- Indexation du profil, de documents Markdown et des offres.
- Synchronisation incrémentale du RAG à partir d’une campagne d’import.
- Audit complet d’une campagne dans l’interface.
- Rapports Markdown et digest HTML.
- Envoi des rapports par email via SMTP.
- Workflow complet déclenchable manuellement.
- Automatisation planifiée en production avec Docker et cron.

Aucune candidature n’est envoyée automatiquement et aucun recruteur n’est contacté par l’application.

---

## Pipeline

```text
SearchScenario
→ génération des plans Apify
→ actors Apify
→ mappers source-specific
→ ExternalJobOffer
→ nettoyage / normalisation
→ déduplication
→ préfiltre de pertinence
→ PostgreSQL
→ historique ImportCampaign
→ scoring / priorisation
→ analyse LLM
→ synchronisation RAG
→ rapport
→ digest email
```

Le workflow automatique utilise le même cœur métier :

```text
cron
→ worker Docker
→ import Apify
→ synchronisation RAG
→ analyses IA
→ rapport de campagne
→ email
```

Le pipeline complet a été validé en production, y compris son déclenchement automatique planifié.

---

## Pourquoi ce projet

L’objectif n’était pas seulement de construire une interface autour d’un LLM.

JobRadar IA m’a permis de travailler sur une chaîne plus complète :

- ingestion de données externes hétérogènes ;
- transformation vers un modèle pivot ;
- qualité et déduplication ;
- modélisation PostgreSQL avec Prisma ;
- batch processing et historisation ;
- structured outputs ;
- contrôle des coûts et appels externes ;
- recherche vectorielle ;
- idempotence ;
- orchestration ;
- distribution par email ;
- déploiement Docker ;
- automatisation et exploitation d’une application IA.

Une partie importante du projet concerne donc les **garde-fous**, la **traçabilité** et la **séparation des responsabilités**, pas seulement la génération de texte.

---

## Stack

### Fullstack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Server Components
- Server Actions

### Données

- PostgreSQL
- Prisma ORM
- pgvector

### Sources

- Apify
- Cheerio
- Playwright
- imports JSON / datasets externes

### IA

- Vercel AI SDK
- OpenAI API
- Zod
- Structured Outputs
- OpenAI Embeddings
- RAG

### Reporting et production

- Nodemailer
- SMTP / Brevo
- Docker
- Docker Compose
- Nginx Proxy Manager
- Let's Encrypt
- cron

### Qualité

- Vitest
- TypeScript
- ESLint

---

## Architecture métier

Quelques objets structurants :

```text
CandidateProfile
= compétences, niveau et préférences du candidat

SearchScenario
= recherche active : rôles, mots-clés, zones, contrats et sources

JobOffer
= état actuel d’une offre

ImportCampaign
= batch d’import

ImportCampaignRun
= exécution d’une source/localisation dans une campagne

ImportCampaignOffer
= événement d’offre observé pendant le batch

JobAnalysis
= analyse structurée générée par le LLM

RagDocumentEmbedding
= document indexé dans le RAG générique
```

Les événements d’une campagne permettent de distinguer notamment :

```text
CREATED
UPDATED
REJECTED_BY_RELEVANCE
PREVIEW_ERROR
IMPORT_ERROR
```

Cette séparation évite de déduire l’historique d’un batch uniquement à partir de `createdAt`.

---

## Scoring et priorisation

Le projet distingue volontairement plusieurs notions.

### Préfiltre

Décide si une offre mérite d’entrer en base.

Il est déterministe et n’utilise pas de LLM.

Il élimine notamment les offres manifestement hors métier tout en restant tolérant sur des signaux comme le niveau senior, une localisation différente ou une stack imparfaite.

### Score de compatibilité

Répond à :

> À quel point cette offre correspond-elle au profil ?

Il prend en compte les compétences, le titre, le contrat, le niveau, la localisation, les signaux IA et la qualité des données.

### Priorité

Répond à :

> Qu’est-ce que je fais de cette offre ?

Niveaux utilisés :

```text
very_promising
interesting
needs_ai_analysis
watch
low_priority
probably_ignore
```

La priorisation sert notamment à éviter d’envoyer inutilement trop d’offres à l’analyse IA.

---

## Analyse LLM

Les offres candidates peuvent être analysées avec un LLM afin d’extraire une structure validée avec Zod.

Exemples de champs :

```text
summary
requiredSkills
niceToHaveSkills
experienceLevel
remotePolicy
salaryMentioned
redFlags
positiveSignals
```

Les analyses sont persistées dans PostgreSQL afin d’éviter des appels répétés.

Les scripts historiques restent protégés par :

- dry-run par défaut ;
- limite explicite ;
- flag d’exécution réel ;
- fake mode ;
- suivi des tokens.

---

## RAG profil-aware

Le RAG utilise un index générique `RagDocumentEmbedding`.

Types de documents actuellement utilisés :

```text
candidate_profile
profile_document
job_offer
```

Cela permet d’interroger ensemble :

- le profil candidat structuré ;
- les documents Markdown de contexte / CV ;
- les offres d’emploi indexées.

Le retrieval enrichit la question utilisateur avec le contexte du profil actif avant la recherche vectorielle.

### Synchronisation incrémentale

Après une campagne, JobRadar ne réindexe pas aveuglément toutes les offres.

Le système construit d’abord un plan :

```text
CREATE
UPDATE
UP_TO_DATE
```

Il compare :

- le contenu vectorisé ;
- le titre ;
- les métadonnées ;
- le modèle d’embedding.

Un nouvel appel d’embedding n’est effectué que lorsqu’il est réellement nécessaire.

---

## Historique des campagnes

Chaque campagne d’import conserve :

- les sources lancées ;
- les localisations ;
- les runs Apify ;
- les offres créées ;
- les offres mises à jour ;
- les offres rejetées ;
- les erreurs ;
- les compteurs du batch.

La route :

```text
/imports/[campaignId]
```

sert d’audit complet d’une campagne.

Elle permet de distinguer :

```text
compatibilité actuelle
≠ score de préfiltre
≠ qualité technique des données
```

---

## Reporting

JobRadar produit plusieurs niveaux de restitution.

### Rapport de veille

Synthèse globale, récente ou limitée à une campagne.

### Rapport complet de campagne

Audit détaillé de tout le batch.

### Digest email

Résumé volontairement court et actionnable contenant les meilleures offres et un lien vers l’audit complet.

Le digest est envoyé côté serveur via SMTP.

---

## Pages principales

```text
/offers
```

Liste paginée des offres avec recherche, filtres, score, priorité et tri.

```text
/offers/[id]
```

Détail d’une offre et analyse IA.

```text
/imports
```

Pilotage des campagnes Apify et historique.

```text
/imports/[campaignId]
```

Audit complet d’une campagne et déclenchement du workflow post-import.

```text
/rag
```

Interface de questions sur le profil, les documents et les offres.

```text
/profile
```

Consultation du profil candidat actif.

```text
/data-quality
```

Contrôle de la qualité des données.

---

## Structure simplifiée

```text
jobradar-ia/
├─ app/
│  ├─ offers/
│  ├─ imports/
│  ├─ rag/
│  ├─ profile/
│  └─ data-quality/
├─ components/
├─ lib/
│  ├─ ai/
│  ├─ imports/
│  ├─ rag/
│  ├─ scoring/
│  ├─ reports/
│  ├─ distribution/
│  ├─ sources/
│  └─ workflows/
├─ scripts/
├─ prisma/
├─ data/
├─ reports/
├─ ops/
├─ Dockerfile
├─ docker-compose.yml
└─ compose.prod.yml
```

---

## Lancer le projet en local

Prérequis :

- Node.js
- Docker
- Docker Compose
- PostgreSQL avec pgvector via le compose fourni

Installation :

```bash
npm install
docker compose up -d
npm run db:generate
npm run db:migrate
npm run dev
```

Application :

```text
http://localhost:3000
```

---

## Variables d’environnement

Exemple minimal :

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME"

OPENAI_API_KEY=""
APIFY_TOKEN=""

USE_FAKE_AI=true

SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
REPORT_EMAIL_FROM=""
REPORT_EMAIL_TO=""

JOBRADAR_APP_BASE_URL="http://localhost:3000"
```

Ne jamais committer les secrets.

Les clés OpenAI, Apify et SMTP sont utilisées uniquement côté serveur.

---

## Commandes utiles

### Vérification

```bash
npm run check
```

### Import

```bash
npm run apify:preview-inputs
npm run external:preview
npm run external:import
```

### Analyse IA

```bash
npm run ai:analyze-candidates -- --limit=5 --dry-run
npm run ai:analyze-candidates -- --limit=5 --run
```

### RAG

```bash
npm run rag:preview-profile-documents
npm run rag:index-profile-documents

npm run rag:campaign:preview -- --campaign-id=<ID>

npm run rag:campaign:sync -- \
  --campaign-id=<ID> \
  --execute \
  --max-documents=10 \
  --max-embeddings=5
```

### Reporting

```bash
npm run report:generate
npm run report:generate -- --campaign-id=latest
npm run report:campaign -- --campaign-id=<ID>
npm run report:email:preview
```

### Workflow

Dry-run :

```bash
npm run workflow:daily:run
```

Le workflow de production possède une configuration séparée et des garde-fous supplémentaires avant l’exécution réelle.

---

## Déploiement

La V2 est déployée sur un serveur personnel ZimaOS avec Docker Compose.

Architecture de production :

```text
Internet
→ HTTPS / reverse proxy
→ Next.js web

cron
→ worker Docker ponctuel
→ PostgreSQL + pgvector
→ APIs externes
```

La base n’est pas exposée publiquement.

Le serveur web et le worker utilisent le même cœur métier, ce qui évite d’avoir une implémentation différente entre les déclenchements manuels et automatiques.

Le workflow planifié a été validé end-to-end en production.

---

## Garde-fous

Le projet privilégie une automatisation bornée :

- pas de secrets côté client ;
- pas d’analyse massive automatique non contrôlée ;
- limites configurables sur les analyses et embeddings ;
- idempotence des imports et du RAG ;
- verrou anti-chevauchement du workflow ;
- persistance des analyses ;
- synchronisation RAG ciblée par campagne ;
- séparation entre import et indexation vectorielle ;
- journalisation des campagnes ;
- dry-run sur les scripts sensibles ;
- aucune candidature automatisée ;
- aucun contact recruteur automatisé.

---

## Ce que j’ai particulièrement travaillé

Au-delà des fonctionnalités visibles, le projet m’a permis d’approfondir :

- architecture Next.js App Router ;
- Server Components et Server Actions ;
- modélisation PostgreSQL / Prisma ;
- migrations et déploiement de schéma ;
- adapters et mappers pour sources hétérogènes ;
- idempotence ;
- batch processing ;
- orchestration de workflows ;
- structured outputs LLM ;
- contrôle des coûts IA ;
- embeddings et recherche vectorielle ;
- Docker multi-stage ;
- séparation web / worker ;
- variables d’environnement en production ;
- reverse proxy et HTTPS ;
- cron, verrous et journalisation ;
- debugging d’un pipeline distribué entre application, conteneurs et services externes.

---

## État du projet

La V2 est considérée comme **fonctionnelle et proche de sa forme finale**.

Le cœur du produit est opérationnel :

```text
collecte
→ filtrage
→ stockage
→ scoring
→ IA
→ RAG
→ audit
→ reporting
→ email
→ automatisation
```

Le projet est désormais davantage dans une phase de stabilisation et de réflexion sur d’éventuelles évolutions que dans une phase de construction du socle.

---

## Pistes futures

Quelques améliorations possibles, non nécessaires au fonctionnement actuel :

- interface d’édition du profil et des scénarios ;
- historisation des workflows et emails ;
- sauvegardes PostgreSQL automatisées ;
- page de statut du dernier workflow ;
- nettoyage automatique des embeddings orphelins ;
- suppression de quelques briques historiques de la V1 ;
- traitement asynchrone des workflows manuels si nécessaire ;
- génération assistée de brouillons de candidature avec validation humaine ;
- authentification si l’application devient multi-utilisateur.

---

## À propos

Projet personnel réalisé dans une logique d’apprentissage et de portfolio.

Les sources externes et actors utilisés restent soumis à leurs propres conditions d’utilisation. L’automatisation est volontairement limitée aux étapes de veille et d’analyse : aucune candidature ni prise de contact n’est automatisée.

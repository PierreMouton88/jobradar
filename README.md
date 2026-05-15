# JobRadar IA

JobRadar IA est un projet pédagogique et portfolio autour du scraping, de la structuration de données et de l’intelligence artificielle appliquée à la recherche d’emploi.

L’objectif est de construire progressivement une application capable de récupérer des offres d’emploi depuis des sources contrôlées, les nettoyer, les stocker en base, puis plus tard les analyser avec des LLMs, du RAG et des agents contrôlés.

Le projet est volontairement découpé en modules pour apprendre étape par étape.

---

## Objectif du projet

Le pipeline cible est :

```txt
scraping
→ nettoyage
→ PostgreSQL
→ analyse LLM structurée
→ RAG
→ agent
→ interface Next.js
```

À l’état actuel, le projet couvre principalement :

```txt
Next.js
→ scraping statique avec Cheerio
→ scraping dynamique avec Playwright
→ stockage PostgreSQL avec Prisma
→ affichage des offres depuis la base
```

Les parties IA, RAG, embeddings et agents ne sont pas encore implémentées.

---

## Objectif pédagogique

Ce projet sert d’abord à apprendre.

L’objectif n’est pas seulement d’obtenir une application fonctionnelle, mais de comprendre :

- comment structurer une application Next.js ;
- comment extraire des données depuis du HTML ;
- pourquoi Cheerio ne suffit pas pour les pages dynamiques ;
- comment Playwright permet d’automatiser un navigateur ;
- pourquoi passer de fichiers JSON à une vraie base PostgreSQL ;
- comment utiliser Prisma pour gérer la base ;
- comment préparer des données propres pour une future couche IA ;
- comment construire un projet explicable en entretien.

---

## Stack technique

### Frontend / fullstack

- Next.js avec App Router
- React
- TypeScript
- Tailwind CSS

### Scraping

- Cheerio pour le scraping statique
- Playwright pour le scraping dynamique

### Base de données

- PostgreSQL
- Prisma ORM
- Docker Compose pour lancer PostgreSQL en local

### Prévu plus tard

- Vercel AI SDK
- OpenAI API ou modèle compatible
- Zod pour les structured outputs
- embeddings
- pgvector
- RAG
- agents IA avec tools contrôlés

---

## État actuel du projet

Le projet contient actuellement :

```txt
Module 1 — Next.js minimum viable
Module 2 — Scraping statique avec Cheerio
Module 3 — Scraping dynamique avec Playwright
Module 4 — PostgreSQL + Prisma
```

Le pipeline actuel est :

```txt
pages fictives / données contrôlées
→ scraping statique ou dynamique
→ export JSON temporaire
→ import PostgreSQL
→ lecture avec Prisma
→ affichage dans Next.js
```

---

## Architecture actuelle

Structure simplifiée du projet :

```txt
jobradar-ia/
├─ app/
│  ├─ offers/
│  │  ├─ page.tsx
│  │  └─ [id]/
│  │     └─ page.tsx
│  ├─ fake-dynamic-jobs/
│  │  └─ page.tsx
│  └─ scraping-runs/
│     └─ page.tsx
│
├─ components/
│  └─ offers/
│     ├─ OfferCard.tsx
│     ├─ OfferList.tsx
│     └─ OfferFilters.tsx
│
├─ lib/
│  ├─ offers/
│  │  ├─ get-offers.ts
│  │  ├─ read-scraped-offers.ts
│  │  └─ offer-normalization.ts
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
│  └─ import-scraped-jobs.ts
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

## Module 1 — Next.js minimum viable

Le premier module a servi à créer une interface minimale avec Next.js.

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
};
```

Les pages `/offers` et `/offers/[id]` utilisent une couche intermédiaire :

```txt
lib/offers/get-offers.ts
```

Cette couche permet de changer la source des données sans modifier directement les pages.

---

## Module 2 — Scraping statique avec Cheerio

Le deuxième module a introduit le scraping statique avec Cheerio.

Objectif :

```txt
HTML local contrôlé
→ parsing avec Cheerio
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

Ces données sont volontairement brutes. Elles ne correspondent pas encore exactement au type utilisé par l’interface.

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

Cette page simule une page dynamique :

```txt
chargement initial
→ affichage différé d’offres
→ bouton “Voir plus”
→ apparition d’une offre supplémentaire
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

En cas d’erreur, un screenshot de debug peut être généré dans :

```txt
debug/dynamic-scraping-error.png
```

---

## Fusion temporaire des JSON

Les fichiers JSON issus du scraping statique et dynamique sont lus par :

```txt
lib/offers/read-scraped-offers.ts
```

Sources actuellement lues :

```txt
data/scraped-jobs.json
data/dynamic-scraped-jobs.json
```

Une première déduplication simple existe :

```txt
même URL = même offre
```

Cette règle est volontairement simple pour le moment.

Elle sera améliorée dans le module suivant avec :

- normalisation d’URL ;
- détection de doublons plus robuste ;
- hash de contenu ;
- meilleure gestion des sources ;
- logs d’anomalies.

---

## Module 4 — PostgreSQL + Prisma

Le quatrième module a ajouté une vraie base de données.

Objectif :

```txt
JSON temporaires
→ import en base PostgreSQL
→ lecture avec Prisma
→ affichage dans l’interface
```

### Pourquoi PostgreSQL ?

Les fichiers JSON sont pratiques pour apprendre, mais limités pour :

- stocker durablement les données ;
- éviter les doublons proprement ;
- filtrer et trier efficacement ;
- garder l’historique des imports ;
- préparer les futures étapes IA/RAG.

PostgreSQL permet de structurer les données de façon plus sérieuse.

### Pourquoi Prisma ?

Prisma sert d’intermédiaire entre TypeScript et PostgreSQL.

Il apporte :

- un schéma de base versionné ;
- des migrations ;
- un client TypeScript typé ;
- des requêtes plus lisibles ;
- `upsert` pour créer ou mettre à jour une offre selon son URL.

---

## Modèles Prisma actuels

Le projet contient deux modèles principaux :

```txt
JobOffer
ScrapingRun
```

### JobOffer

Représente une offre d’emploi stockée en base.

Champs importants :

```txt
title
company
location
contractType
remote
skills
description
source
url
scrapedAt
createdAt
updatedAt
```

Le champ `url` est unique.

Cela permet d’éviter les doublons simples :

```txt
une URL = une offre
```

### ScrapingRun

Représente une session de scraping ou d’import.

Champs importants :

```txt
source
status
offersCount
startedAt
finishedAt
errorMessage
```

Cela permet de tracer les imports et de savoir :

- quand un import a été lancé ;
- combien d’offres ont été traitées ;
- si l’import a réussi ou échoué ;
- quelle erreur s’est produite.

---

## Pages disponibles

### Accueil des offres

```txt
/offers
```

Affiche les offres stockées en base PostgreSQL.

### Détail d’une offre

```txt
/offers/[id]
```

Affiche le détail d’une offre depuis PostgreSQL.

### Historique des imports

```txt
/scraping-runs
```

Affiche les dernières sessions d’import ou de scraping enregistrées en base.

---

## Installation du projet

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer les variables d’environnement

Copier `.env.example` vers `.env` ou `.env.local`.

Exemple de configuration locale :

```env
DATABASE_URL="postgresql://jobradar:jobradar_password@localhost:5432/jobradar"
```

Ne jamais committer `.env` ou `.env.local`.

Le dépôt doit seulement contenir :

```txt
.env.example
```

---

## Lancer PostgreSQL en local

Le projet utilise Docker Compose pour lancer PostgreSQL.

Commande :

```bash
docker compose up -d
```

Vérifier que le conteneur tourne :

```bash
docker ps
```

Le conteneur PostgreSQL devrait être accessible sur :

```txt
localhost:5432
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

Cette commande génère le client TypeScript Prisma à partir de `schema.prisma`.

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

Prisma Studio permet de visualiser les tables et les données dans le navigateur.

---

## Scripts disponibles

### Lancer le serveur Next.js

```bash
npm run dev
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

```txt
lit les fichiers JSON
→ crée une ligne ScrapingRun
→ insère ou met à jour les offres avec upsert
→ évite les doublons via l’URL unique
```

### Ouvrir Prisma Studio

```bash
npm run db:studio
```

### Lancer le build

```bash
npm run build
```

---

## Pipeline de développement actuel

Pour lancer le projet localement :

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
http://localhost:3000/scraping-runs
```

---

## Variables d’environnement

Exemple de `.env.example` :

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME"
USE_FAKE_AI=true
USE_FAKE_SCRAPER=true
```

Pour le développement local actuel :

```env
DATABASE_URL="postgresql://jobradar:jobradar_password@localhost:5432/jobradar"
```

Ne jamais stocker de vraies clés API dans le dépôt.

---

## Sécurité et garde-fous

Le projet respecte plusieurs règles :

- ne pas committer `.env` ou `.env.local` ;
- ne pas exposer de clés API côté frontend ;
- ne pas scraper de sources sensibles au début ;
- éviter LinkedIn, Indeed, Google Jobs, Instagram et les sites avec login ;
- travailler d’abord sur des pages fictives ou contrôlées ;
- limiter les appels réseau agressifs ;
- garder les futures actions d’agent sous contrôle humain.

---

## Sources de données

Pour l’instant, les sources sont volontairement fictives ou locales.

Cela permet d’apprendre :

- la structure d’un scraper ;
- l’extraction de données ;
- les limites de Cheerio ;
- l’usage de Playwright ;
- la transformation des données ;
- le stockage en base ;

sans dépendre de sites externes, de protections anti-bot ou de conditions d’utilisation complexes.

---

## Choix techniques importants

### Next.js App Router

Le projet utilise Next.js avec App Router pour apprendre une structure moderne d’application React fullstack.

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
- requêtes plus sûres ;
- `upsert`.

### Pas encore d’IA

L’IA n’est pas encore intégrée volontairement.

Avant d’ajouter un LLM, le projet doit avoir :

```txt
données stockées
→ données nettoyées
→ données normalisées
→ données traçables
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

Exemple :

```txt
feature/module-4-postgresql-prisma
```

Workflow :

```txt
1. partir de develop
2. créer une branche feature
3. travailler dessus
4. commit régulièrement
5. merger dans develop quand le module est stable
6. merger develop dans main quand la version est montrable
```

---

## Commandes Git utiles

Vérifier l’état :

```bash
git status
```

Voir les derniers commits :

```bash
git log --oneline --decorate -5
```

Créer une branche de module :

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nom-du-module
git push -u origin feature/nom-du-module
```

---

## Roadmap

### Module 1 — Next.js minimum viable

Statut : terminé.

Objectif :

```txt
Créer une interface simple affichant des offres fictives.
```

### Module 2 — Scraping statique avec Cheerio

Statut : terminé.

Objectif :

```txt
Extraire des offres depuis du HTML local contrôlé.
```

### Module 3 — Scraping dynamique avec Playwright

Statut : terminé.

Objectif :

```txt
Automatiser un navigateur pour récupérer des données générées par JavaScript.
```

### Module 4 — PostgreSQL + Prisma

Statut : en cours de finalisation / fonctionnel.

Objectif :

```txt
Stocker les offres en base et les lire depuis l’application.
```

### Module 5 — Nettoyage, normalisation et dédoublonnage

Statut : à venir.

Objectif :

```txt
Améliorer la qualité des données avant l’analyse IA.
```

À prévoir :

- normalisation des URLs ;
- nettoyage des descriptions ;
- détection plus robuste des skills ;
- meilleure déduplication ;
- gestion des champs manquants ;
- logs d’anomalies.

### Module 6 — LLM structured extraction

Statut : à venir.

Objectif :

```txt
Utiliser un LLM pour extraire des informations structurées depuis les offres.
```

### Module 7 — Scoring par rapport au profil

Statut : à venir.

Objectif :

```txt
Comparer les offres au profil candidat.
```

### Module 8 — RAG sur les offres

Statut : à venir.

Objectif :

```txt
Poser des questions en langage naturel sur les offres stockées.
```

### Module 9 — Agent avec tools contrôlés

Statut : à venir.

Objectif :

```txt
Créer un agent capable d’utiliser des tools limités et validés.
```

### Module 10 — Qualité, sécurité, README et portfolio

Statut : à venir.

Objectif :

```txt
Rendre le projet présentable en entretien.
```

---

## Prochaines étapes techniques

Après le Module 4, la suite logique est le Module 5.

Priorités :

```txt
1. normaliser les URLs
2. améliorer la détection des doublons
3. nettoyer les descriptions
4. améliorer la détection des compétences
5. ajouter des logs d’anomalies
6. préparer les données pour l’analyse IA
```

On ne commence pas encore par le RAG ou les agents.

---

## Ce que ce projet montre en entretien

Ce projet permet d’expliquer :

- pourquoi commencer avec des données fictives ;
- comment fonctionne le scraping statique ;
- pourquoi Playwright est utile pour les pages dynamiques ;
- pourquoi stocker les données en base ;
- comment éviter les doublons avec une contrainte unique ;
- comment fonctionne Prisma ;
- comment utiliser des migrations ;
- comment structurer un pipeline de données ;
- pourquoi nettoyer les données avant de les envoyer à un LLM ;
- quelles limites juridiques et techniques existent autour du scraping ;
- comment préparer progressivement une application IA sérieuse.

---

## Limites actuelles

Le projet est encore pédagogique.

Limites connues :

- les sources sont fictives ou locales ;
- la déduplication est encore simple ;
- les skills sont détectées par dictionnaire basique ;
- il n’y a pas encore d’interface d’administration ;
- il n’y a pas encore d’analyse IA ;
- il n’y a pas encore de RAG ;
- il n’y a pas encore d’agent ;
- il n’y a pas encore de vraie gestion utilisateur ;
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

---

## Licence

Projet personnel pédagogique et portfolio.

Les données utilisées dans les premiers modules sont fictives ou contrôlées.
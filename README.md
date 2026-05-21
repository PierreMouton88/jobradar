# JobRadar IA

JobRadar IA est un projet pédagogique et portfolio autour du scraping, de la structuration de données et de l’intelligence artificielle appliquée à l’analyse d’offres d’emploi.

L’objectif est de construire progressivement une application capable de :

- récupérer des offres depuis des sources contrôlées ;
- nettoyer et normaliser les données ;
- stocker les offres dans PostgreSQL ;
- analyser les offres avec un LLM ;
- valider les sorties IA avec Zod ;
- tracer les coûts et les tokens consommés ;
- préparer ensuite du scoring, du RAG et des agents contrôlés.

Le projet avance module par module afin de rester compréhensible et explicable en entretien.

---

## Pipeline cible

```txt
scraping
→ nettoyage / normalisation / déduplication
→ PostgreSQL
→ analyse LLM structurée
→ scoring profil
→ RAG
→ agent contrôlé
→ interface Next.js
État actuel du projet

Le projet couvre actuellement :

Module 1 — Next.js minimum viable
Module 2 — Scraping statique avec Cheerio
Module 3 — Scraping dynamique avec Playwright
Module 4 — PostgreSQL + Prisma
Module 5 — Nettoyage, normalisation, déduplication et qualité des données
Module 6 — Analyse LLM structurée avec Zod et OpenAI

Le pipeline fonctionnel actuel est :

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
→ affichage des résultats et des métadonnées IA

Les parties RAG, embeddings, scoring candidat et agents ne sont pas encore implémentées.

Objectif pédagogique

Ce projet sert d’abord à apprendre.

L’objectif n’est pas seulement d’obtenir une application fonctionnelle, mais de comprendre :

comment structurer une application Next.js avec App Router ;
comment extraire des données depuis du HTML ;
pourquoi Cheerio ne suffit pas pour les pages dynamiques ;
comment Playwright permet d’automatiser un navigateur ;
pourquoi passer de fichiers JSON à une vraie base PostgreSQL ;
comment utiliser Prisma pour gérer les migrations et les relations ;
comment nettoyer et normaliser des données avant de les exploiter ;
comment éviter les doublons ;
comment utiliser un LLM pour produire une analyse structurée ;
pourquoi valider les sorties IA avec Zod ;
comment tracer les tokens et les coûts d’une analyse IA ;
comment construire un projet explicable en entretien.
Stack technique
Frontend / fullstack
Next.js avec App Router
React
TypeScript
Tailwind CSS
Server Components
Server Actions
Scraping
Cheerio pour le scraping statique
Playwright pour le scraping dynamique
Base de données
PostgreSQL
Prisma ORM
Docker Compose pour lancer PostgreSQL en local
IA
Vercel AI SDK
OpenAI API
Zod
Structured outputs
Mode fake IA avec USE_FAKE_AI
Stockage des analyses IA en base
Suivi des tokens consommés
Estimation indicative du coût par requête
Prévu plus tard
scoring par rapport au profil candidat ;
embeddings ;
pgvector ;
RAG ;
agents IA avec tools contrôlés.
Architecture simplifiée
jobradar-ia/
├─ app/
│  ├─ offers/
│  │  ├─ page.tsx
│  │  └─ [id]/
│  │     ├─ page.tsx
│  │     ├─ actions.ts
│  │     └─ AnalyzeSubmitButton.tsx
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
│  └─ test-analyze-and-save-job-offer.ts
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
Modules réalisés
Module 1 — Next.js minimum viable

Le premier module a créé une interface minimale avec Next.js.

Routes principales :

/offers
/offers/[id]

Composants principaux :

components/offers/OfferCard.tsx
components/offers/OfferList.tsx
components/offers/OfferFilters.tsx

Type principal côté UI :

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
};

Les pages ne lisent pas directement la base ou les JSON. Elles passent par :

lib/offers/get-offers.ts
Module 2 — Scraping statique avec Cheerio

Le deuxième module a introduit le scraping statique.

Objectif :

HTML local contrôlé
→ parsing Cheerio
→ extraction d’offres
→ export JSON

Fichiers principaux :

lib/scraping/static-job-parser.ts
lib/scraping/static-job-parser.test-data.ts
lib/scraping/export-static-jobs.ts

Script npm :

npm run scrape:static

Ce script génère :

data/scraped-jobs.json

Type brut utilisé par le parser :

export type ScrapedJobOffer = {
  title: string;
  company: string;
  location: string;
  contractType: string;
  description: string;
  url: string;
};
Module 3 — Scraping dynamique avec Playwright

Le troisième module a introduit Playwright pour comprendre le scraping de pages générées par JavaScript.

Objectif :

page dynamique locale
→ ouverture avec Playwright
→ attente du rendu JavaScript
→ clic sur “Voir plus”
→ extraction des offres
→ export JSON

Route locale de test :

/fake-dynamic-jobs

Fichiers principaux :

lib/scraping/dynamic-job-scraper.ts
lib/scraping/export-dynamic-jobs.ts

Script npm :

npm run scrape:dynamic

Ce script génère :

data/dynamic-scraped-jobs.json

En cas d’erreur, un screenshot peut être généré dans :

debug/dynamic-scraping-error.png
Module 4 — PostgreSQL + Prisma

Le quatrième module a ajouté une vraie base de données.

Objectif :

JSON temporaires
→ import en base PostgreSQL
→ lecture avec Prisma
→ affichage dans Next.js
Pourquoi PostgreSQL ?

Les fichiers JSON sont pratiques pour apprendre, mais limités pour :

stocker durablement les données ;
éviter les doublons proprement ;
filtrer et trier efficacement ;
garder l’historique des imports ;
préparer les futures étapes IA/RAG.
Pourquoi Prisma ?

Prisma sert d’intermédiaire entre TypeScript et PostgreSQL.

Il apporte :

un schéma versionné ;
des migrations ;
un client TypeScript typé ;
des requêtes lisibles ;
upsert pour créer ou mettre à jour une offre selon son URL.
Module 5 — Nettoyage, normalisation, déduplication et qualité

Le cinquième module a amélioré la qualité des données avant la couche IA.

Objectif :

données brutes
→ données nettoyées
→ données normalisées
→ données dédupliquées
→ données traçables

Fonctionnalités ajoutées :

nettoyage des chaînes de caractères ;
normalisation des URLs ;
suppression des paramètres UTM ;
suppression des slashs finaux inutiles ;
détection améliorée du télétravail ;
détection améliorée des compétences techniques ;
déduplication par URL normalisée ;
déduplication par clé métier title + company + location ;
rapport de déduplication ;
analyse qualité des offres ;
stockage qualityScore et qualityIssues en base ;
page /data-quality.

Fichiers principaux :

lib/offers/offer-cleaning.ts
lib/offers/offer-deduplication.ts
lib/offers/offer-quality.ts
lib/offers/offer-normalization.ts
lib/offers/read-scraped-offers.ts
app/data-quality/page.tsx

La page qualité est disponible ici :

/data-quality

Elle affiche notamment :

le nombre total d’offres ;
le score qualité moyen ;
les offres avec anomalies ;
les anomalies les plus fréquentes ;
les offres à vérifier en priorité.
Module 6 — LLM structured extraction

Le sixième module a ajouté une analyse IA structurée des offres.

Objectif :

description d’offre
→ LLM
→ objet structuré
→ validation Zod
→ stockage PostgreSQL
→ affichage dans la page détail

L’analyse IA est déclenchée manuellement depuis :

/offers/[id]

Le bouton appelle une Server Action Next.js :

app/offers/[id]/actions.ts

La logique métier est séparée dans :

lib/ai/analyze-and-save-job-offer.ts
lib/ai/analyze-job-offer.ts

Le schéma de sortie est défini avec Zod dans :

lib/ai/job-analysis-schema.ts
Données extraites par l’IA

Une analyse contient notamment :

summary
requiredSkills
niceToHaveSkills
experienceLevel
remotePolicy
salaryMentioned
redFlags
positiveSignals

Exemples :

experienceLevel:
internship | junior | mid | senior | unknown

remotePolicy:
on_site | hybrid | full_remote | unknown
Mode fake IA

Le projet prévoit un mode fake pour éviter les appels API inutiles :

USE_FAKE_AI=true

En fake mode :

pas d’appel OpenAI
pas de consommation de tokens
analyse simulée
pipeline testable localement
Mode réel

En mode réel :

USE_FAKE_AI=false

L’application appelle OpenAI via le Vercel AI SDK.

La clé API est stockée uniquement côté serveur :

OPENAI_API_KEY="your_api_key_here"

Elle ne doit jamais être exposée côté frontend ni commitée.

Métadonnées IA

Chaque analyse stocke aussi :

analysisMode
modelName
inputTokens
outputTokens
totalTokens

L’interface affiche :

le mode d’analyse ;
le modèle utilisé ;
le nombre de tokens consommés ;
une estimation indicative du coût de la requête.

L’estimation du coût est calculée dans :

lib/ai/estimate-ai-cost.ts
Modèles Prisma actuels

Le projet contient notamment :

JobOffer
ScrapingRun
JobAnalysis
JobOffer

Représente une offre d’emploi stockée en base.

Champs importants :

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
qualityScore
qualityIssues
createdAt
updatedAt

Le champ url est unique.

ScrapingRun

Représente une session de scraping ou d’import.

Champs importants :

source
status
offersCount
startedAt
finishedAt
errorMessage

Cela permet de tracer les imports.

JobAnalysis

Représente une analyse IA associée à une offre.

Champs importants :

jobOfferId
summary
requiredSkills
niceToHaveSkills
experienceLevel
remotePolicy
salaryMentioned
redFlags
positiveSignals
analysisMode
modelName
inputTokens
outputTokens
totalTokens
createdAt
updatedAt

Pour l’instant :

une offre = une analyse IA maximum

La relation est assurée avec :

jobOfferId unique
Pages disponibles
Liste des offres
/offers

Affiche les offres stockées en base PostgreSQL.

Détail d’une offre
/offers/[id]

Affiche :

les informations principales de l’offre ;
la description ;
l’analyse IA si elle existe ;
les compétences requises ;
les compétences bonus ;
les signaux positifs ;
les points de vigilance ;
les métadonnées IA ;
un bouton pour générer ou relancer l’analyse.
Historique des imports
/scraping-runs

Affiche les dernières sessions d’import.

Dashboard qualité
/data-quality

Affiche les statistiques de qualité des données.

Page dynamique fictive
/fake-dynamic-jobs

Sert à tester le scraping dynamique avec Playwright.

Installation du projet
1. Installer les dépendances
npm install
2. Configurer les variables d’environnement

Copier .env.example vers .env.local.

Exemple :

DATABASE_URL="postgresql://jobradar:jobradar_password@localhost:5432/jobradar"
OPENAI_API_KEY="your_api_key_here"
USE_FAKE_AI=true
USE_FAKE_SCRAPER=true

Ne jamais committer :

.env
.env.local

Le dépôt doit seulement contenir :

.env.example
Lancer PostgreSQL en local

Le projet utilise Docker Compose.

Commande :

docker compose up -d

Vérifier que le conteneur tourne :

docker ps

PostgreSQL est accessible sur :

localhost:5432
Prisma
Générer le client Prisma
npm run db:generate

Ou directement :

npx prisma generate
Lancer les migrations
npm run db:migrate

Ou directement :

npx prisma migrate dev
Ouvrir Prisma Studio
npm run db:studio

Ou directement :

npx prisma studio
Important après modification du schema Prisma

Après une migration ou une modification de relation, relancer :

npx prisma generate

Puis redémarrer le serveur Next.js :

Ctrl + C
npm run dev

Si le cache Next pose problème :

Remove-Item .next -Recurse -Force
npm run dev
Scripts disponibles
Lancer le serveur Next.js
npm run dev
Lancer le build
npm run build
Scraping statique
npm run scrape:static

Génère :

data/scraped-jobs.json
Scraping dynamique
npm run scrape:dynamic

Génère :

data/dynamic-scraped-jobs.json
Importer les offres JSON en base
npm run db:import:scraped

Ce script :

lit les fichiers JSON
nettoie les offres
déduplique les offres
analyse la qualité
crée une ligne ScrapingRun
insère ou met à jour les offres avec upsert
stocke qualityScore et qualityIssues
Ouvrir Prisma Studio
npm run db:studio
Scripts de test IA
npm run ai:test
npm run ai:test:save

Ces scripts servent à tester l’analyse IA hors interface.

Pipeline de développement local

Pour lancer l’application :

docker compose up -d
npm run dev

Pour refaire tout le pipeline de données :

npm run scrape:static
npm run scrape:dynamic
npm run db:import:scraped

Puis consulter :

http://localhost:3000/offers
http://localhost:3000/scraping-runs
http://localhost:3000/data-quality
Tester l’analyse IA
En fake mode

Dans .env.local :

USE_FAKE_AI=true

Puis :

npm run dev

Sur une page détail :

/offers/[id]

Cliquer sur :

Analyser avec IA fake
En mode réel

Dans .env.local :

USE_FAKE_AI=false

Redémarrer le serveur :

Ctrl + C
npm run dev

Puis relancer l’analyse sur une seule offre.

Repasser ensuite en fake mode pour éviter les appels involontaires :

USE_FAKE_AI=true
Variables d’environnement

Exemple de .env.example :

DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME"
OPENAI_API_KEY="your_api_key_here"
USE_FAKE_AI=true
USE_FAKE_SCRAPER=true

Variables principales :

DATABASE_URL
→ connexion PostgreSQL

OPENAI_API_KEY
→ clé API OpenAI côté serveur uniquement

USE_FAKE_AI
→ true pour fake mode, false pour vrai appel LLM

USE_FAKE_SCRAPER
→ réservé aux futurs tests autour du scraping
Sécurité et garde-fous

Le projet respecte plusieurs règles :

ne pas committer .env ou .env.local ;
ne pas exposer de clé API côté frontend ;
ne pas appeler automatiquement l’IA sur toutes les offres ;
déclencher l’analyse IA manuellement ;
stocker les analyses pour éviter les appels répétés ;
afficher le mode fake ou réel dans l’interface ;
afficher les tokens consommés ;
estimer le coût de la requête ;
ne pas scraper de sources sensibles au début ;
éviter LinkedIn, Indeed, Google Jobs, Instagram et les sites avec login ;
travailler d’abord sur des pages fictives ou contrôlées ;
garder les futures actions d’agent sous contrôle humain.
Sources de données

Pour l’instant, les sources sont fictives ou locales.

Cela permet d’apprendre :

la structure d’un scraper ;
l’extraction de données ;
les limites de Cheerio ;
l’usage de Playwright ;
la transformation des données ;
le stockage en base ;
l’analyse IA structurée ;

sans dépendre de sites externes, de protections anti-bot ou de conditions d’utilisation complexes.

Choix techniques importants
Next.js App Router

Le projet utilise Next.js avec App Router pour apprendre une structure moderne d’application React fullstack.

Server Components et Server Actions

Les pages lisent les données côté serveur.

Les actions sensibles, comme l’analyse IA, passent par une Server Action afin de garder :

Prisma
OpenAI
variables d’environnement
logique métier

côté serveur.

Cheerio avant Playwright

Cheerio a été utilisé d’abord parce qu’il est plus simple pour comprendre :

le HTML ;
le DOM ;
les sélecteurs CSS ;
l’extraction de texte.
Playwright ensuite

Playwright a été ajouté pour gérer les pages dynamiques qui chargent leur contenu avec JavaScript.

PostgreSQL + Prisma

PostgreSQL a été choisi pour préparer une base solide avant les futures étapes IA et RAG.

Prisma apporte :

migrations ;
typage TypeScript ;
client de base de données ;
relations ;
upsert.
Zod pour les structured outputs

Zod permet de définir un schéma de sortie attendu pour l’analyse IA.

L’objectif est d’éviter d’utiliser directement une réponse libre du LLM.

Le flux est :

LLM
→ objet structuré
→ validation Zod
→ stockage PostgreSQL
→ affichage UI
Mode fake IA

Le fake mode permet de tester le pipeline sans consommer l’API.

Il est utile pour :

développer l’UI ;
tester les Server Actions ;
éviter les coûts inutiles ;
travailler sans clé API.
Organisation Git recommandée

Le projet suit une organisation proche d’un workflow professionnel :

main
→ branche stable et montrable

develop
→ branche d’intégration

feature/...
→ branches de travail par module

Exemples :

feature/module-4-postgresql-prisma
feature/module-5-data-cleaning
feature/module-6-llm-structured-extraction

Workflow :

1. partir de develop
2. créer une branche feature
3. travailler dessus
4. commit régulièrement
5. merger dans develop quand le module est stable
6. merger develop dans main quand la version est montrable
Commandes Git utiles

Vérifier l’état :

git status

Voir les derniers commits :

git log --oneline --decorate -5

Créer une branche de module :

git checkout develop
git pull origin develop
git checkout -b feature/nom-du-module
git push -u origin feature/nom-du-module

Commit recommandé pour le Module 6 :

git add .
git commit -m "feat(ai): add structured job analysis"
git push
Roadmap
Module 1 — Next.js minimum viable

Statut : terminé.

Objectif :

Créer une interface simple affichant des offres fictives.
Module 2 — Scraping statique avec Cheerio

Statut : terminé.

Objectif :

Extraire des offres depuis du HTML local contrôlé.
Module 3 — Scraping dynamique avec Playwright

Statut : terminé.

Objectif :

Automatiser un navigateur pour récupérer des données générées par JavaScript.
Module 4 — PostgreSQL + Prisma

Statut : terminé.

Objectif :

Stocker les offres en base et les lire depuis l’application.
Module 5 — Nettoyage, normalisation et dédoublonnage

Statut : terminé.

Objectif :

Améliorer la qualité des données avant l’analyse IA.
Module 6 — LLM structured extraction

Statut : terminé.

Objectif :

Utiliser un LLM pour extraire des informations structurées depuis les offres.
Module 7 — Scoring par rapport au profil

Statut : à venir.

Objectif :

Comparer les offres au profil candidat.
Module 8 — RAG sur les offres

Statut : à venir.

Objectif :

Poser des questions en langage naturel sur les offres stockées.
Module 9 — Agent avec tools contrôlés

Statut : à venir.

Objectif :

Créer un agent capable d’utiliser des tools limités et validés.
Module 10 — Qualité, sécurité, README et portfolio

Statut : à venir.

Objectif :

Rendre le projet présentable en entretien.
Prochaines étapes techniques

Après le Module 6, la suite logique est le Module 7.

## Module 7 — Scoring par rapport au profil candidat

Le Module 7 ajoute un score de compatibilité entre chaque offre et un profil candidat statique.

L’objectif n’est pas de laisser le LLM décider si une offre est bonne ou mauvaise. Le LLM sert d’abord à extraire des informations structurées depuis l’offre, comme le niveau estimé, la politique remote, les signaux positifs ou les points de vigilance. Le score final est ensuite calculé par du code TypeScript explicite.

Le profil candidat est défini dans :

```txt
lib/profile/candidate-profile.ts

Priorités :

1. créer un profil candidat simple
2. définir les compétences maîtrisées
3. définir les compétences en apprentissage
4. définir les préférences de contrat / remote / localisation
5. créer un score de compatibilité
6. afficher ce score sur les offres
7. trier ou filtrer les offres par pertinence

On ne commence pas encore par le RAG ou les agents.

Ce que ce projet montre en entretien

Ce projet permet d’expliquer :

pourquoi commencer avec des données fictives ;
comment fonctionne le scraping statique ;
pourquoi Playwright est utile pour les pages dynamiques ;
pourquoi stocker les données en base ;
comment éviter les doublons ;
comment fonctionne Prisma ;
comment utiliser des migrations ;
pourquoi nettoyer les données avant de les envoyer à un LLM ;
comment utiliser un LLM pour produire une sortie structurée ;
pourquoi valider cette sortie avec Zod ;
comment stocker une analyse IA en base ;
comment éviter les appels API inutiles ;
comment suivre les tokens et estimer les coûts ;
quelles limites juridiques et techniques existent autour du scraping ;
comment préparer progressivement une application IA sérieuse.
Limites actuelles

Le projet est encore pédagogique.

Limites connues :

les sources sont fictives ou locales ;
les données ne viennent pas encore de vraies APIs ou sources publiques ;
l’analyse IA dépend fortement de la qualité du prompt ;
l’estimation de coût est indicative ;
il n’y a pas encore de scoring candidat ;
il n’y a pas encore de RAG ;
il n’y a pas encore d’agent ;
il n’y a pas encore de gestion utilisateur ;
il n’y a pas encore de déploiement production finalisé.

Ces limites sont volontaires : le projet avance module par module.

Notes pour le développement

Avec Prisma 7, la configuration est séparée :

prisma/schema.prisma
→ modèles, enums, relations

prisma.config.ts
→ configuration de la CLI Prisma et DATABASE_URL

lib/prisma.ts
→ PrismaClient utilisé par le code applicatif

Le projet utilise aussi un adapter PostgreSQL pour Prisma Client.

Après modification de schema.prisma, penser à :

npx prisma generate

Puis redémarrer le serveur Next.js.

Licence

Projet personnel pédagogique et portfolio.

Les données utilisées dans les premiers modules sont fictives ou contrôlées.
export const fakeJobsHtml = `
  <main>
    <h1>Offres d'emploi</h1>

    <article class="job-card">
      <h2 class="job-title">Développeur Frontend React Junior</h2>
      <p class="job-company">Atelier Nova</p>
      <p class="job-location">Nancy - Hybride</p>
      <p class="job-contract">CDI</p>
      <p class="job-description">
        Atelier Nova recherche un développeur frontend junior pour rejoindre une petite équipe produit.
        Tu participeras à la création d'interfaces React et Next.js pour une plateforme SaaS B2B.
        Les missions incluent l'intégration de maquettes Figma, la création de composants TypeScript
        réutilisables, la consommation d'API REST, la correction de bugs UI et la participation aux revues de code.
        Une première expérience en React, TypeScript et Tailwind est appréciée, mais l'équipe prévoit un
        accompagnement par un développeur senior. Des connaissances en tests frontend avec Jest ou Cypress sont un plus.
        Le poste est ouvert aux profils junior motivés, avec deux jours de télétravail par semaine.
      </p>
      <a class="job-link" href="https://example.com/jobs/frontend-react-junior">
        Voir l'offre
      </a>
    </article>

    <article class="job-card">
      <h2 class="job-title">Développeur Fullstack TypeScript</h2>
      <p class="job-company">DataCraft</p>
      <p class="job-location">Remote</p>
      <p class="job-contract">Alternance</p>
      <p class="job-description">
        DataCraft propose une alternance en développement fullstack TypeScript.
        Tu travailleras sur une application interne de suivi de données métiers avec Next.js côté frontend,
        Node.js et NestJS côté backend, Prisma pour l'accès aux données et PostgreSQL comme base principale.
        Les missions seront progressives : développement de pages, création de routes API, amélioration de requêtes Prisma,
        ajout de tests simples et participation à la documentation technique.
        L'équipe cherche une personne curieuse, rigoureuse, capable de poser des questions et de progresser dans un cadre accompagné.
        Docker est utilisé en local pour lancer les services.
        Le poste est compatible full remote avec points réguliers en visio.
      </p>
      <a class="job-link" href="https://example.com/jobs/fullstack-typescript-alternance">
        Voir l'offre
      </a>
    </article>

    <article class="job-card">
      <h2 class="job-title">Développeur Fullstack JavaScript Autonome</h2>
      <p class="job-company">FastScale Agency</p>
      <p class="job-location">Paris - Présentiel</p>
      <p class="job-contract">CDI</p>
      <p class="job-description">
        FastScale Agency recherche un développeur fullstack JavaScript capable d'être opérationnel rapidement
        sur plusieurs projets clients. Le poste implique de travailler sur des applications React, Node.js et PostgreSQL,
        avec des délais courts et des changements fréquents de priorités.
        Le candidat devra être autonome rapidement, gérer plusieurs sujets en parallèle et communiquer directement avec les clients.
        Une expérience confirmée de 3 à 5 ans est souhaitée.
        La connaissance de Docker, Git et des pipelines CI/CD est demandée.
        Le poste est principalement en présentiel, avec télétravail exceptionnel selon les projets.
      </p>
      <a class="job-link" href="https://example.com/jobs/fullstack-js-autonome">
        Voir l'offre
      </a>
    </article>

    <article class="job-card">
      <h2 class="job-title">Développeur Backend Node.js Junior</h2>
      <p class="job-company">GreenMetrics</p>
      <p class="job-location">Lyon - Hybride</p>
      <p class="job-contract">CDD</p>
      <p class="job-description">
        GreenMetrics développe des outils de reporting environnemental pour les PME.
        Nous recherchons un développeur backend junior pour contribuer à des API Node.js et NestJS.
        Les missions incluent la création d'endpoints REST, la modélisation de données avec Prisma,
        l'écriture de requêtes PostgreSQL, la gestion d'erreurs et l'ajout de tests unitaires.
        Une bonne base en TypeScript est attendue.
        Des notions de Docker et d'architecture API sont appréciées.
        L'équipe fonctionne en code review et accompagne les profils juniors dans leur montée en compétence.
        Télétravail possible deux jours par semaine.
      </p>
      <a class="job-link" href="https://example.com/jobs/backend-node-junior">
        Voir l'offre
      </a>
    </article>

    <article class="job-card">
      <h2 class="job-title">Lead Developer Fullstack</h2>
      <p class="job-company">ScaleForge</p>
      <p class="job-location">Full remote</p>
      <p class="job-contract">Freelance</p>
      <p class="job-description">
        ScaleForge cherche un Lead Developer Fullstack pour piloter l'évolution technique d'une plateforme SaaS internationale.
        La mission comprend la définition de l'architecture, l'encadrement de développeurs, la mise en place de bonnes pratiques CI/CD,
        l'optimisation des performances backend et la contribution au frontend React et Next.js.
        Une forte expérience en TypeScript, Node.js, PostgreSQL, Docker et cloud est attendue.
        Le profil doit être capable de prendre des décisions techniques, challenger les choix produit et accompagner l'équipe.
        Expérience senior ou lead indispensable.
        Mission full remote, rythme soutenu.
      </p>
      <a class="job-link" href="https://example.com/jobs/lead-fullstack-senior">
        Voir l'offre
      </a>
    </article>

    <!-- Doublon volontaire : même URL que la première offre -->
    <article class="job-card">
      <h2 class="job-title">Développeur Frontend React Junior</h2>
      <p class="job-company">Atelier Nova</p>
      <p class="job-location">Nancy - Hybride</p>
      <p class="job-contract">CDI</p>
      <p class="job-description">
        Atelier Nova recherche un développeur frontend junior pour rejoindre une petite équipe produit.
        Cette annonce est volontairement dupliquée pour tester la déduplication par URL.
      </p>
      <a class="job-link" href="https://example.com/jobs/frontend-react-junior">
        Voir l'offre
      </a>
    </article>

    <!-- Offre incomplète volontaire : sert à tester le dashboard qualité -->
    <article class="job-card">
      <h2 class="job-title">Offre incomplète</h2>
      <p class="job-location">Metz</p>
      <p class="job-contract">Inconnu</p>
      <p class="job-description">
        Description trop courte.
      </p>
      <a class="job-link" href="https://example.com/jobs/incomplete-offer">
        Voir l'offre
      </a>
    </article>
  </main>
`;
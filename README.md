# Planify

> Application web collaborative de gestion de tâches auto‑hébergeable : créez, organisez et suivez tâches et sous‑tâches avec dossiers, labels et commentaires.

## Sommaire

- [À propos](#à-propos)
- [Fonctionnalités](#fonctionnalités)
- [Sécurité et authentification](#sécurité-et-authentification)
- [Stack et architecture](#stack-et-architecture)
- [Modèle de données](#modèle-de-données)
- [Déployement](#déployement)

## À propos

Planify est une application web collaborative de gestion de tâches, auto‑hébergeable, permettant de créer, organiser et suivre des tâches et sous‑tâches par dossiers, labels et commentaires.  
Elle gère le partage sélectif avec permissions propriétaire/lecture/écriture, l’attribution, les statuts à faire/en cours/terminé, la priorité et l’échéance, avec une authentification sécurisée.

## Fonctionnalités

- Création, modification et suppression de tâches avec sous‑tâches checklist, statuts todo/doing/done, priorités et dates d’échéance.
- Organisation par dossiers, étiquetage avec labels et fil de commentaires sur chaque tâche.
- Collaboration via invitations et contacts, attribution d’un responsable, tableau de bord et suivi d’avancement.
- Partage contrôlé par permissions owner/read/write sur tâches et dossiers.

## Sécurité et authentification

- Connexion email/mot de passe avec JWT valide 7 jours stocké en cookie HttpOnly et Secure, puis redirection vers le tableau de bord.
- Mots de passe hachés Argon2id, JWT HS256, CORS par allowlist, révocation par timestamp et middlewares d’authentification testés.
- Déploiement durci avec Traefik, TLS en production, en‑têtes de sécurité, rate limiting, images Distroless non‑root et réseaux Docker isolés.

## Stack et architecture

- Frontend React/Next.js, backend Node.js/Express, API REST avec Drizzle ORM et base PostgreSQL.
- Architecture contrôleurs/services/routes, initialisation Express avec secret JWT et connexion PostgreSQL.
- Monorepo avec Docker Compose et reverse‑proxy Traefik, CI/CD et tests E2E Cypress.

## Modèle de données

- Entités USER, FOLDER, TASK, SUBTASK, COMMENT, LABEL et tables de jonction USEROWNFOLDER/USEROWNTASK portant la permission.
- Champs clés: titre, description, statut todo/doing/done, priorité 1–3, échéance optionnelle, FK nullables pour dossier et responsable.
- Intégrité: cascades sur commentaires/sous‑tâches et SET NULL sur certaines FK, email utilisateur unique.

# Déployement

Ce guide vous expliquera comment déployer l'application en utilisant Docker.

## Prérequis

- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/products/docker-desktop/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Déploiement

Suivez ces étapes pour lancer l'application Planify.

### 1. Cloner le dépôt

Ouvrez votre terminal et clonez le dépôt Git.

```bash
git clone https://github.com/SuperKn4cky/Planify.git
cd Planify
```

### 2. Créer le fichier d'environnement

Créez un fichier nommé `.env` à la racine du projet, puis copiez le modèle ci‑dessous.

```bash
touch .env
```

> Assurez‑vous de remplacer les valeurs vides ou par défaut par vos propres informations.

<details>
<summary>.env – Modèle</summary>

```ini
# .env

# Secret pour les jetons JWT (doit être une chaîne de caractères sécurisée)
# Vous pouvez en générer un avec : openssl rand -hex 32 ou head -c 32 /dev/urandom | base64
JWT_SECRET="your_super_secret_hs256_key"

# Domaine origin pour le reverse proxy et l'url des lien contenu dans les mail
APP_DOMAIN="your_domain"

# Base de données PostgreSQL
POSTGRES_DB="Planify"
POSTGRES_USER="root"
POSTGRES_PASSWORD="your_strong_password"

DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}

# Configuration pgAdmin (optionnel)
PGADMIN_DEFAULT_EMAIL="admin@example.com"
PGADMIN_DEFAULT_PASSWORD="admin"

# Configuration SMTP pour l'envoi d'e-mails
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_SECURE=false # true pour le port 465, false pour les autres
SMTP_USER="user@example.com"
SMTP_PASS="your_smtp_password"

# Configuration certificat
ACME_EMAIL="your_email"
```

</details>

### 3. Lancer les conteneurs

Une fois votre fichier `.env` configuré, lancez l'ensemble des services avec Docker Compose.

```bash
docker compose up -d
```

L'application devrait maintenant être accessible.

- traefik: http://localhost:443
- pgAdmin: http://localhost:8080

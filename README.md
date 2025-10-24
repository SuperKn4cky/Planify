# Planify

Ce guide vous expliquera comment déployer l'application en utilisant Docker.

## Prérequis

- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/products/docker-desktop/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Déploiement

Suivez ces étapes pour lancer l'application Planify.

### 1. Cloner le dépôt

Ouvrez votre terminal et clonez le dépôt Git :

```bash
git clone https://github.com/SuperKn4cky/Planify.git
cd Planify
```

### 2. Créer le fichier d'environnement

Créez un fichier nommé `.env` à la racine du projet. Vous pouvez copier le contenu de l'exemple ci-dessous et le coller dans votre nouveau fichier.

```bash
touch .env
```

Voici un modèle pour votre fichier `.env`. **Assurez-vous de remplacer les valeurs vides ou par défaut par vos propres informations.**

```ini
# .env

# Base de données PostgreSQL
POSTGRES_DB=Planify
POSTGRES_USER=root
POSTGRES_PASSWORD=your_strong_password

# URL de connexion à la base de données pour le backend
# Assurez-vous que 'user' et 'password' correspondent à POSTGRES_USER et POSTGRES_PASSWORD
DATABASE_URL="postgres://root:your_strong_password@db:5432/Planify"

# Secret pour les jetons JWT (doit être une chaîne de caractères sécurisée)
# Vous pouvez en générer un avec : openssl rand -hex 32
JWT_SECRET=your_super_secret_hs256_key

# URLs du frontend autorisées par CORS (séparées par des virgules si multiples)
FRONTEND_URL=http://localhost:3000

# Configuration pgAdmin (optionnel)
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=admin

# Configuration SMTP pour l'envoi d'e-mails
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false # true pour le port 465, false pour les autres
SMTP_USER=user@example.com
SMTP_PASS=your_smtp_password
```

### 3. Lancer les conteneurs

Une fois votre fichier `.env` configuré, lancez l'ensemble des services avec Docker Compose :

```bash
docker compose up -d
```

L'application devrait maintenant être accessible :

- **Frontend**: http://localhost:3000
- **pgAdmin**: http://localhost:8080

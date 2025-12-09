#!/bin/bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 /chemin/vers/backup.sql[.gz]"
  exit 1
fi

BACKUP_PATH="$1"

if [ ! -f "$BACKUP_PATH" ]; then
  echo "Fichier de backup introuvable: $BACKUP_PATH"
  exit 1
fi

APP_DIR="${APP_DIR:-$HOME/app/Planify}"

if [ -f "$APP_DIR/.env" ]; then
  . "$APP_DIR/.env"
fi

CONTAINER_NAME="${CONTAINER_NAME:-Planify-postgres}"
DB_NAME="${POSTGRESDB:-Planify}"
DB_USER="${POSTGRESUSER:-root}"

echo "Restauration de $BACKUP_PATH dans la base '$DB_NAME' du conteneur '$CONTAINER_NAME'…"

if echo "$BACKUP_PATH" | grep -qE '\.gz$'; then
  gunzip -c "$BACKUP_PATH" | docker exec -i "$CONTAINER_NAME" \
    psql -U "$DB_USER" -d "$DB_NAME"
else
  cat "$BACKUP_PATH" | docker exec -i "$CONTAINER_NAME" \
    psql -U "$DB_USER" -d "$DB_NAME"
fi

echo "Restauration terminée."

#!/bin/bash
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/app/Planify}"

if [ -f "$APP_DIR/.env" ]; then
  . "$APP_DIR/.env"
fi

CONTAINER_NAME="${CONTAINER_NAME:-Planify-postgres}"
DB_NAME="${POSTGRESDB:-Planify}"
DB_USER="${POSTGRESUSER:-root}"
BACKUP_DIR="$APP_DIR/backups"

mkdir -p "$BACKUP_DIR"

DATE="$(date +%F_%H-%M)"
FILE="$BACKUP_DIR/planify_${DATE}.sql.gz"

docker exec "$CONTAINER_NAME" \
  pg_dump -U "$DB_USER" "$DB_NAME" \
  | gzip > "$FILE"

find "$BACKUP_DIR" -type f -mtime +7 -delete

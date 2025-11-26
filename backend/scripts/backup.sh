#!/bin/bash

# Backup directory
BACKUP_DIR="../backups"
mkdir -p "$BACKUP_DIR"

# Database config (should match your .env or config)
DB_NAME="threat_intelligence"
# In a real app, use a dedicated backup user. Here we use arguments or defaults.
DB_USER=${1:-root}
DB_PASS=${2:-""}

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/backup_$TIMESTAMP.sql"

echo "Creating backup of $DB_NAME..."

if [ -z "$DB_PASS" ]; then
    mysqldump -u "$DB_USER" "$DB_NAME" > "$FILENAME"
else
    mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$FILENAME"
fi

if [ $? -eq 0 ]; then
    echo "Backup created successfully: $FILENAME"
    echo "{\"status\": \"success\", \"file\": \"$FILENAME\"}"
else
    echo "Backup failed"
    echo "{\"status\": \"error\"}"
    exit 1
fi

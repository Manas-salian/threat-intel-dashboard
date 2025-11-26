#!/bin/bash

DB_NAME="threat_intelligence"
DB_USER=${2:-root}
DB_PASS=${3:-""}
BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Error: No backup file specified"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: File not found: $BACKUP_FILE"
    exit 1
fi

echo "Restoring $DB_NAME from $BACKUP_FILE..."

if [ -z "$DB_PASS" ]; then
    mysql -u "$DB_USER" "$DB_NAME" < "$BACKUP_FILE"
else
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    echo "Restore completed successfully"
    echo "{\"status\": \"success\"}"
else
    echo "Restore failed"
    echo "{\"status\": \"error\"}"
    exit 1
fi

#!/usr/bin/env bash
# ========================================================
# MySQL Automated Backup Script (Linux & Docker)
# Database: toeic_dictation
# Retention: 7 days
# ========================================================

set -euo pipefail

DB_NAME="${1:-${MYSQL_DATABASE:-toeic_dictation}}"
DB_USER="${DB_USER:-${MYSQL_USER:-root}}"
DB_PASS="${DB_PASS:-${MYSQL_ROOT_PASSWORD:-ToeicDictation@2026!}}"
DB_HOST="${DB_HOST:-${MYSQL_HOST:-127.0.0.1}}"
DB_PORT="${DB_PORT:-${MYSQL_PORT:-3306}}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/../backups"
mkdir -p "${BACKUP_DIR}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${DB_NAME}_${TIMESTAMP}.sql"

echo "==================================================="
echo "  TOEIC Dictation - MySQL Automated Backup System"
echo "==================================================="
echo "[*] Database target: ${DB_NAME}"
echo "[*] Destination: ${BACKUP_FILE}"

if [ -z "${DB_PASS}" ]; then
  mysqldump -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" \
    --single-transaction --quick --routines --triggers "${DB_NAME}" > "${BACKUP_FILE}"
else
  MYSQL_PWD="${DB_PASS}" mysqldump -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" \
    --single-transaction --quick --routines --triggers "${DB_NAME}" > "${BACKUP_FILE}"
fi

FILE_SIZE=$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}" 2>/dev/null || echo "0")
echo "[SUCCESS] Backup created successfully! (Size: ${FILE_SIZE} bytes)"

echo "[*] Enforcing retention policy: deleting backups older than 7 days..."
find "${BACKUP_DIR}" -name "backup_*.sql" -type f -mtime +7 -delete || true

echo "==================================================="
echo "  Backup Process Finished!"
echo "==================================================="

#!/bin/bash

# ===========================================
# Database Backup Script
# ===========================================
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
RETENTION_DAYS=${RETENTION_DAYS:-30}
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="ecommerce_backup_${DATE}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Database configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${POSTGRES_DB:-ecommerce_db}
DB_USER=${POSTGRES_USER:-ecommerce_user}

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        print_status "Created backup directory: $BACKUP_DIR"
    fi
}

# Perform database backup
backup_database() {
    print_status "Starting database backup..."

    # Check if PostgreSQL is available
    if ! command -v pg_dump &> /dev/null; then
        print_error "pg_dump is not installed. Please install PostgreSQL client tools."
        exit 1
    fi

    # Perform the backup
    PGPASSWORD=${POSTGRES_PASSWORD} pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -F p \
        -f "${BACKUP_DIR}/${BACKUP_FILE}" \
        --verbose

    if [ $? -eq 0 ]; then
        print_success "Database backup created: ${BACKUP_DIR}/${BACKUP_FILE}"
    else
        print_error "Database backup failed"
        exit 1
    fi
}

# Compress backup
compress_backup() {
    print_status "Compressing backup..."

    if command -v gzip &> /dev/null; then
        gzip "${BACKUP_DIR}/${BACKUP_FILE}"
        if [ $? -eq 0 ]; then
            print_success "Backup compressed: ${BACKUP_DIR}/${COMPRESSED_FILE}"
        else
            print_error "Compression failed"
            exit 1
        fi
    else
        print_warning "gzip not available, skipping compression"
    fi
}

# Calculate backup size
get_backup_size() {
    if [ -f "${BACKUP_DIR}/${COMPRESSED_FILE}" ]; then
        size=$(du -h "${BACKUP_DIR}/${COMPRESSED_FILE}" | cut -f1)
        echo "$size"
    elif [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
        size=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
        echo "$size"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    print_status "Cleaning up backups older than ${RETENTION_DAYS} days..."

    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -name "ecommerce_backup_*" -type f -mtime +${RETENTION_DAYS} -delete
        remaining=$(find "$BACKUP_DIR" -name "ecommerce_backup_*" -type f | wc -l)
        print_status "Remaining backups: $remaining"
    fi
}

# List existing backups
list_backups() {
    print_status "Existing backups:"
    echo ""

    if [ -d "$BACKUP_DIR" ]; then
        ls -lh "$BACKUP_DIR"/ecommerce_backup_* 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
    else
        echo "  No backups found"
    fi

    echo ""
}

# Restore database from backup
restore_database() {
    local backup_file=$1

    if [ -z "$backup_file" ]; then
        print_error "Please provide a backup file to restore"
        echo "Usage: $0 restore <backup_file>"
        exit 1
    fi

    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi

    print_warning "This will overwrite the current database!"
    read -p "Are you sure you want to continue? (y/N): " confirm

    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        print_status "Restore cancelled"
        exit 0
    fi

    print_status "Restoring database from: $backup_file"

    # Check if file is compressed
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | PGPASSWORD=${POSTGRES_PASSWORD} psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --quiet
    else
        PGPASSWORD=${POSTGRES_PASSWORD} psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            -f "$backup_file" \
            --quiet
    fi

    if [ $? -eq 0 ]; then
        print_success "Database restored successfully"
    else
        print_error "Database restore failed"
        exit 1
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_file=$1

    print_status "Verifying backup integrity..."

    if [[ "$backup_file" == *.gz ]]; then
        if gzip -t "$backup_file"; then
            print_success "Backup file integrity verified"
        else
            print_error "Backup file is corrupted"
            exit 1
        fi
    else
        if grep -q "PostgreSQL database dump" "$backup_file"; then
            print_success "Backup file integrity verified"
        else
            print_error "Backup file appears to be invalid"
            exit 1
        fi
    fi
}

# Main function
main() {
    case "${1:-backup}" in
        backup)
            echo ""
            echo "==========================================="
            echo "  Database Backup"
            echo "==========================================="
            echo ""

            create_backup_dir
            backup_database
            compress_backup

            size=$(get_backup_size)
            echo ""
            print_success "Backup completed successfully!"
            print_status "File: ${BACKUP_DIR}/${COMPRESSED_FILE}"
            print_status "Size: $size"
            echo ""

            cleanup_old_backups
            list_backups
            ;;
        restore)
            restore_database "$2"
            ;;
        list)
            list_backups
            ;;
        verify)
            verify_backup "$2"
            ;;
        cleanup)
            cleanup_old_backups
            ;;
        *)
            echo "Usage: $0 {backup|restore|list|verify|cleanup}"
            echo ""
            echo "Commands:"
            echo "  backup          Create a new backup"
            echo "  restore <file>  Restore from a backup file"
            echo "  list            List existing backups"
            echo "  verify <file>   Verify backup integrity"
            echo "  cleanup         Remove old backups"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"

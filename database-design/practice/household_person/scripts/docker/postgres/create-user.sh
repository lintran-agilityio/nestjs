#!/bin/bash

# PostgreSQL User Creation Script
# This script creates a new user with database creation privileges

set -e

# Default values (can be overridden by environment variables)
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"postgres"}
DB_NAME=${DB_NAME:-"postgres"}

echo "Creating PostgreSQL user: $DB_USER"

# Create user with password
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    CREATE DATABASE $DB_NAME OWNER $DB_USER;
    GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
    ALTER USER $DB_USER CREATEDB;
EOSQL

echo "User $DB_USER created successfully with database $DB_NAME"

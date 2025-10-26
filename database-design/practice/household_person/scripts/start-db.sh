#!/bin/bash

# TV Company Database Management Script

set -e

echo "Household Person Database Management Script"
echo "=================================="

# Function to start the database
start_database() {
  echo "🚀 Starting PostgreSQL database..."
  docker compose up -d

  echo "⏳ Waiting for database to be ready..."
  sleep 10

  echo "✅ Database is ready!"
  echo "📊 Connection details:"
  echo "   Host: localhost"
  echo "   Port: 5433"
  echo "   Database: household_management"
  echo "   User: household_management_user"
  echo "   Password: household_management_pass"
}

# Function to stop the database
stop_database() {
    echo "🛑 Stopping PostgreSQL database..."
    docker compose down
    echo "✅ Database stopped!"
}

# Function to restart the database
restart_database() {
    echo "🔄 Restarting PostgreSQL database..."
    docker compose down
    docker compose up -d
    echo "✅ Database restarted!"
}

# Function to show database status
status_database() {
    echo "📊 Database status:"
    docker compose ps
}

# Function to connect to database
connect_database() {
  echo "🔌 Connecting to database..."
  docker exec -it household_management_db psql -U household_management_user -d household_management_db
}

# Function to show logs
show_logs() {
  echo "📋 Database logs:"
  docker compose logs postgres
}

# Function to reset database (WARNING: This will delete all data)
reset_database() {
  echo "⚠️  WARNING: This will delete all data!"
  read -p "Are you sure you want to reset the database? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Resetting database..."
    docker compose down -v
    docker compose up -d
    echo "✅ Database reset complete!"
  else
    echo "❌ Reset cancelled."
  fi
}

# Function to show help
show_help() {
  echo "Usage: $0 [command]"
  echo ""
  echo "Commands:"
  echo "  start     - Start the database"
  echo "  stop      - Stop the database"
  echo "  restart   - Restart the database"
  echo "  status    - Show database status"
  echo "  connect   - Connect to database with psql"
  echo "  logs      - Show database logs"
  echo "  reset     - Reset database (delete all data)"
  echo "  help      - Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 start"
  echo "  $0 connect"
  echo "  $0 status"
}

# Main script logic
case "${1:-help}" in
  start)
    start_database
    ;;
  stop)
    stop_database
    ;;
  restart)
    restart_database
    ;;
  status)
    status_database
    ;;
  connect)
    connect_database
    ;;
  logs)
    show_logs
    ;;
  reset)
    reset_database
    ;;
  help|*)
    show_help
    ;;
esac
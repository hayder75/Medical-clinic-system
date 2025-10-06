#!/bin/bash

# Development Workflow Script
echo "🔄 Medical Clinic System - Development Mode"
echo "=========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Function to show usage
show_usage() {
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  dev     - Start development mode (with hot reload)"
    echo "  prod    - Start production mode"
    echo "  stop    - Stop all services"
    echo "  logs    - Show logs"
    echo "  restart - Restart services"
    echo "  clean   - Clean up everything"
    echo ""
}

# Function to start development mode
start_dev() {
    echo "🚀 Starting development mode..."
    echo "   - Hot reload enabled"
    echo "   - Volume mounting for live code changes"
    echo "   - Development dependencies included"
    echo ""
    
    docker compose -f docker-compose.dev.yml up -d --build
    
    echo ""
    echo "✅ Development services started!"
    echo "🌐 Frontend: http://localhost:3001"
    echo "🌐 Backend:  http://localhost:3000"
    echo ""
    echo "💡 Code changes will automatically reload!"
}

# Function to start production mode
start_prod() {
    echo "🚀 Starting production mode..."
    docker compose up -d --build
    
    echo ""
    echo "✅ Production services started!"
    echo "🌐 Frontend: http://localhost:3001"
    echo "🌐 Backend:  http://localhost:3000"
}

# Function to stop services
stop_services() {
    echo "🛑 Stopping all services..."
    docker compose down
    docker compose -f docker-compose.dev.yml down
    echo "✅ All services stopped!"
}

# Function to show logs
show_logs() {
    echo "📋 Showing logs..."
    docker compose logs -f
}

# Function to restart services
restart_services() {
    echo "🔄 Restarting services..."
    docker compose restart
    echo "✅ Services restarted!"
}

# Function to clean up
clean_up() {
    echo "🧹 Cleaning up..."
    docker compose down -v
    docker compose -f docker-compose.dev.yml down -v
    docker system prune -f
    echo "✅ Cleanup complete!"
}

# Main script logic
case "$1" in
    "dev")
        start_dev
        ;;
    "prod")
        start_prod
        ;;
    "stop")
        stop_services
        ;;
    "logs")
        show_logs
        ;;
    "restart")
        restart_services
        ;;
    "clean")
        clean_up
        ;;
    *)
        show_usage
        ;;
esac

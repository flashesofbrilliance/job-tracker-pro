#!/bin/bash

# 🚀 Stable Sushi Discovery Deployment Script
# Handles proper process management, health checks, and rollback

set -e  # Exit on any error

PROJECT_DIR="/Users/zharris/job-tracker-pro"
SERVER_SCRIPT="dev-server-warp.js"
PORT=8081
PID_FILE="$PROJECT_DIR/server.pid"
LOG_FILE="$PROJECT_DIR/deployment-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

# Function to check if server is responding
health_check() {
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/api/job-recommendations" | grep -q "200"; then
            return 0
        fi
        log "Health check attempt $attempt/$max_attempts failed, retrying..."
        sleep 2
        ((attempt++))
    done
    return 1
}

# Function to stop existing server
stop_server() {
    log "🛑 Stopping existing server..."
    
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            sleep 3
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid"
            fi
            success "Stopped server (PID: $pid)"
        fi
        rm -f "$PID_FILE"
    fi
    
    # Kill any orphaned processes
    pkill -f "$SERVER_SCRIPT" 2>/dev/null || true
    pkill -f "node.*server" 2>/dev/null || true
    
    # Wait for port to be free
    while lsof -i ":$PORT" >/dev/null 2>&1; do
        log "Waiting for port $PORT to be free..."
        sleep 1
    done
    
    success "All processes cleaned up"
}

# Function to start server
start_server() {
    log "🚀 Starting Sushi Discovery Server..."
    
    cd "$PROJECT_DIR"
    
    # Start server with nohup to survive terminal disconnection
    nohup node "$SERVER_SCRIPT" > "$LOG_FILE" 2>&1 &
    local server_pid=$!
    
    # Save PID
    echo "$server_pid" > "$PID_FILE"
    log "Server started with PID: $server_pid"
    
    # Wait a moment for server to initialize
    sleep 3
    
    # Verify server is running
    if ! kill -0 "$server_pid" 2>/dev/null; then
        error "Server failed to start!"
        return 1
    fi
    
    success "Server process running (PID: $server_pid)"
    return 0
}

# Function to run comprehensive health checks
run_health_checks() {
    log "🏥 Running comprehensive health checks..."
    
    # Check if server process is alive
    local pid=$(cat "$PID_FILE" 2>/dev/null || echo "")
    if [ -z "$pid" ] || ! kill -0 "$pid" 2>/dev/null; then
        error "Server process not running"
        return 1
    fi
    
    # Check if port is bound
    if ! lsof -i ":$PORT" >/dev/null 2>&1; then
        error "Port $PORT not bound"
        return 1
    fi
    
    # Check API endpoints
    if health_check; then
        success "API health check passed"
    else
        error "API health check failed"
        return 1
    fi
    
    # Check main page
    if curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/discovery-simple.html" | grep -q "200"; then
        success "Main page accessible"
    else
        error "Main page not accessible"
        return 1
    fi
    
    # Check service worker
    if curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/sw.js" | grep -q "200"; then
        success "Service worker accessible"
    else
        warning "Service worker not accessible (non-critical)"
    fi
    
    success "All health checks passed!"
    return 0
}

# Function to display server status
show_status() {
    local pid=$(cat "$PID_FILE" 2>/dev/null || echo "")
    
    echo ""
    echo -e "${BLUE}🍣 Sushi Discovery Server Status${NC}"
    echo "=================================="
    
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        success "Status: Running (PID: $pid)"
        echo -e "${GREEN}🚀 Server: http://127.0.0.1:$PORT${NC}"
        echo -e "${GREEN}🍣 App: http://127.0.0.1:$PORT/discovery-simple.html${NC}"
        echo -e "${GREEN}📊 API: http://127.0.0.1:$PORT/api/job-recommendations${NC}"
        echo ""
        success "Ready for use! 🎉"
    else
        error "Status: Not running"
    fi
    echo ""
}

# Main deployment function
deploy() {
    log "🍣 Starting Stable Sushi Discovery Deployment"
    log "============================================="
    
    # Stop existing server
    stop_server
    
    # Start new server
    if start_server; then
        success "Server started successfully"
    else
        error "Failed to start server"
        exit 1
    fi
    
    # Run health checks
    if run_health_checks; then
        success "Deployment successful!"
        show_status
        return 0
    else
        error "Health checks failed - rolling back"
        stop_server
        exit 1
    fi
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "start")
        start_server && show_status
        ;;
    "stop")
        stop_server
        ;;
    "status")
        show_status
        ;;
    "health")
        run_health_checks
        ;;
    "logs")
        tail -f "$LOG_FILE"
        ;;
    *)
        echo "Usage: $0 {deploy|start|stop|status|health|logs}"
        exit 1
        ;;
esac
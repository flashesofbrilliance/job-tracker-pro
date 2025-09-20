#!/usr/bin/env bash
set -euo pipefail

# Rollback Testing Script for Job Tracker Pro
# Tests rollback functionality and validates recovery procedures

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v gh >/dev/null 2>&1; then
        error "GitHub CLI (gh) is required"
        exit 1
    fi
    
    if ! command -v node >/dev/null 2>&1; then
        error "Node.js is required"
        exit 1
    fi
    
    if ! gh auth status >/dev/null 2>&1; then
        error "GitHub CLI not authenticated. Run: gh auth login"
        exit 1
    fi
    
    log "✓ Prerequisites met"
}

get_environment_status() {
    local env="$1"
    local base_url="https://$(gh repo view --json nameWithOwner --jq '.nameWithOwner' | tr '/' '.github.io/')"
    local env_url="${base_url}/env/${env}/latest/"
    
    log "Checking ${env} environment: ${env_url}"
    
    if command -v curl >/dev/null 2>&1; then
        if curl -f -s "${env_url}" >/dev/null 2>&1; then
            log "✓ ${env} environment is accessible"
            return 0
        else
            warn "✗ ${env} environment is not accessible"
            return 1
        fi
    else
        warn "curl not available, skipping accessibility check"
        return 0
    fi
}

run_health_check() {
    local env="$1"
    local base_url="https://$(gh repo view --json nameWithOwner --jq '.nameWithOwner' | tr '/' '.github.io/')"
    local env_url="${base_url}/env/${env}/latest"
    
    log "Running health check for ${env}..."
    
    if [ -f "$SCRIPT_DIR/health-check.js" ]; then
        if node "$SCRIPT_DIR/health-check.js" "$env_url" "$env"; then
            log "✓ Health check passed for ${env}"
            return 0
        else
            error "✗ Health check failed for ${env}"
            return 1
        fi
    else
        warn "Health check script not found, skipping"
        return 0
    fi
}

simulate_deployment() {
    local env="$1"
    log "Simulating deployment to ${env}..."
    
    # This would normally be done by pushing a tag or branch
    # For testing, we'll just create a test scenario
    log "✓ Simulated deployment to ${env}"
}

test_rollback() {
    local env="$1"
    log "Testing rollback for ${env} environment..."
    
    # Check if we can execute rollback workflow
    log "Attempting to trigger rollback workflow..."
    
    if gh workflow run rollback.yml -f "env=${env}" 2>/dev/null; then
        log "✓ Rollback workflow triggered successfully"
        
        # Wait a bit for the workflow to start
        sleep 10
        
        # Check workflow status
        local latest_run=$(gh run list --workflow=rollback.yml --limit=1 --json=databaseId,status,conclusion --jq '.[0]')
        local run_id=$(echo "$latest_run" | jq -r '.databaseId')
        local status=$(echo "$latest_run" | jq -r '.status')
        
        log "Rollback workflow run ID: $run_id, Status: $status"
        
        # Wait for completion (up to 5 minutes)
        local timeout=300
        local elapsed=0
        
        while [ $elapsed -lt $timeout ]; do
            local current_status=$(gh run view "$run_id" --json=status,conclusion | jq -r '.status')
            
            if [ "$current_status" = "completed" ]; then
                local conclusion=$(gh run view "$run_id" --json=conclusion | jq -r '.conclusion')
                
                if [ "$conclusion" = "success" ]; then
                    log "✓ Rollback completed successfully"
                    return 0
                else
                    error "✗ Rollback failed with conclusion: $conclusion"
                    return 1
                fi
            fi
            
            log "Waiting for rollback to complete... (${elapsed}s/${timeout}s)"
            sleep 30
            elapsed=$((elapsed + 30))
        done
        
        error "✗ Rollback timed out after ${timeout} seconds"
        return 1
        
    else
        error "✗ Failed to trigger rollback workflow"
        return 1
    fi
}

validate_post_rollback() {
    local env="$1"
    log "Validating post-rollback state for ${env}..."
    
    # Wait a bit for GitHub Pages to update
    log "Waiting for GitHub Pages to update..."
    sleep 60
    
    # Run health check
    if run_health_check "$env"; then
        log "✓ Post-rollback health check passed"
    else
        error "✗ Post-rollback health check failed"
        return 1
    fi
    
    # Check if environment is accessible
    if get_environment_status "$env"; then
        log "✓ Environment is accessible after rollback"
    else
        error "✗ Environment is not accessible after rollback"
        return 1
    fi
    
    log "✓ Post-rollback validation completed"
    return 0
}

run_rollback_test() {
    local env="${1:-qa}" # Default to QA environment for testing
    
    log "Starting rollback test for ${env} environment"
    log "================================================="
    
    # Step 1: Check prerequisites
    check_prerequisites
    
    # Step 2: Check current environment status
    log "Step 1: Checking current environment status..."
    get_environment_status "$env" || warn "Environment may not be deployed yet"
    
    # Step 3: Run pre-rollback health check
    log "Step 2: Running pre-rollback health check..."
    run_health_check "$env" || warn "Pre-rollback health check issues detected"
    
    # Step 4: Execute rollback
    log "Step 3: Executing rollback test..."
    if test_rollback "$env"; then
        log "✓ Rollback execution successful"
    else
        error "✗ Rollback execution failed"
        return 1
    fi
    
    # Step 5: Validate post-rollback state
    log "Step 4: Validating post-rollback state..."
    if validate_post_rollback "$env"; then
        log "✓ Post-rollback validation successful"
    else
        error "✗ Post-rollback validation failed"
        return 1
    fi
    
    log "================================================="
    log "✅ Rollback test completed successfully for ${env}!"
    
    return 0
}

# Main execution
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    ENV="${1:-qa}"
    
    if [ "$ENV" = "--help" ] || [ "$ENV" = "-h" ]; then
        echo "Usage: $0 [environment]"
        echo ""
        echo "Test rollback functionality for specified environment"
        echo ""
        echo "Arguments:"
        echo "  environment    Environment to test (dev|qa|stage|prod), default: qa"
        echo ""
        echo "Examples:"
        echo "  $0           # Test rollback for QA environment"
        echo "  $0 stage     # Test rollback for stage environment"
        echo ""
        echo "Prerequisites:"
        echo "  - GitHub CLI (gh) installed and authenticated"
        echo "  - Node.js installed"
        echo "  - Repository has rollback workflow configured"
        exit 0
    fi
    
    cd "$ROOT_DIR"
    
    log "Job Tracker Pro - Rollback Test"
    log "Environment: $ENV"
    log "Repository: $(git remote get-url origin 2>/dev/null || echo 'unknown')"
    log ""
    
    if run_rollback_test "$ENV"; then
        log "🎉 All rollback tests passed!"
        exit 0
    else
        error "❌ Rollback tests failed!"
        exit 1
    fi
fi
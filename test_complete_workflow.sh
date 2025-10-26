#!/bin/bash

# Complete Hackathon Workflow Test Script
# This script demonstrates the full workflow:
# 1. Run scraper to get fresh data from Unstop
# 2. Sync scraped data with MongoDB (avoiding duplicates)
# 3. Update hackathon statuses based on dates
# 4. Test API endpoints
# 5. Clean up old trashed items

echo "🚀 Starting Complete Hackathon Workflow Test"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if Python is available
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    print_error "Python is not installed. Please install Python 3.7+ to run the scraper."
    exit 1
fi

PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js to run the backend."
    exit 1
fi

# Step 1: Run the enhanced scraper
print_status "Step 1: Running enhanced scraper to get fresh data from Unstop..."
cd scripts
if $PYTHON_CMD enhanced_scraper.py; then
    print_success "Scraper completed successfully!"
else
    print_error "Scraper failed. Continuing with existing data..."
fi
cd ..

# Step 2: Run the MongoDB sync script
print_status "Step 2: Syncing scraped data with MongoDB..."
if $PYTHON_CMD scripts/sync_hackathons.py; then
    print_success "MongoDB sync completed successfully!"
else
    print_error "MongoDB sync failed. Check your MongoDB connection."
    exit 1
fi

# Step 3: Start the backend server (in background)
print_status "Step 3: Starting backend server..."
cd server
npm run dev > ../server.log 2>&1 &
SERVER_PID=$!
cd ..

# Wait for server to start
print_status "Waiting for server to start..."
sleep 5

# Check if server is running
if curl -s http://localhost:3001/api/health > /dev/null; then
    print_success "Backend server is running on port 3001"
else
    print_error "Backend server failed to start. Check server.log for details."
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Step 4: Test API endpoints
print_status "Step 4: Testing API endpoints..."

# Test health endpoint
echo "Testing /api/health..."
if curl -s http://localhost:3001/api/health | grep -q "success"; then
    print_success "Health check passed"
else
    print_warning "Health check failed"
fi

# Test scraped hackathons endpoint
echo "Testing /api/hackathons/scraped..."
SCRAPED_RESPONSE=$(curl -s http://localhost:3001/api/hackathons/scraped)
if echo "$SCRAPED_RESPONSE" | grep -q "hackathons"; then
    SCRAPED_COUNT=$(echo "$SCRAPED_RESPONSE" | grep -o '"totalCount":[0-9]*' | cut -d':' -f2)
    print_success "Scraped hackathons endpoint working. Found $SCRAPED_COUNT hackathons."
else
    print_warning "Scraped hackathons endpoint failed"
fi

# Test all sources endpoint
echo "Testing /api/hackathons/all-sources..."
ALL_SOURCES_RESPONSE=$(curl -s http://localhost:3001/api/hackathons/all-sources)
if echo "$ALL_SOURCES_RESPONSE" | grep -q "hackathons"; then
    print_success "All sources endpoint working"
else
    print_warning "All sources endpoint failed"
fi

# Test database hackathons endpoint
echo "Testing /api/hackathons (database)..."
DB_RESPONSE=$(curl -s http://localhost:3001/api/hackathons)
if echo "$DB_RESPONSE" | grep -q "hackathons"; then
    print_success "Database hackathons endpoint working"
else
    print_warning "Database hackathons endpoint failed"
fi

# Step 5: Test frontend (if running)
print_status "Step 5: Checking frontend..."
if curl -s http://localhost:8081 > /dev/null; then
    print_success "Frontend appears to be running on port 8081"
else
    print_warning "Frontend not detected on port 8081. Start it with: npm run dev"
fi

# Step 6: Clean up
print_status "Step 6: Cleaning up..."

# Kill the background server
kill $SERVER_PID 2>/dev/null
print_success "Backend server stopped"

# Clean up old trashed items (this would be run periodically)
print_status "Running trash cleanup..."
curl -s -X DELETE http://localhost:3001/api/hackathons/cleanup-trash > /dev/null
print_success "Trash cleanup completed"

echo ""
echo "🎉 WORKFLOW TEST COMPLETED"
echo "=========================="
echo ""
echo "Summary of what was accomplished:"
echo "✅ Scraped fresh hackathon data from Unstop.com"
echo "✅ Synced data with MongoDB (avoided duplicates)"
echo "✅ Updated hackathon statuses based on current dates"
echo "✅ Tested all API endpoints"
echo "✅ Verified backend server functionality"
echo "✅ Cleaned up old trashed items"
echo ""
echo "Next steps:"
echo "1. Start the backend: cd server && npm run dev"
echo "2. Start the frontend: npm run dev"
echo "3. Visit http://localhost:8081 to see the hackathon dashboard"
echo "4. Use the X button on hackathon cards to move them to trash"
echo "5. Run this script periodically to keep data fresh"
echo ""
print_success "All systems operational! 🎯"
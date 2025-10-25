#!/bin/bash

echo "🚀 HACKATHON SCRAPER INTEGRATION TEST"
echo "====================================="

# Test 1: Check if scraped data exists
echo ""
echo "📁 Test 1: Checking scraped data files..."
if [ -f "data/hackathons_dynamic.json" ]; then
    echo "✅ hackathons_dynamic.json exists"
    SCRAPED_COUNT=$(jq length data/hackathons_dynamic.json 2>/dev/null || echo "0")
    echo "   → Found $SCRAPED_COUNT scraped hackathons"
else
    echo "❌ No scraped data found. Running scraper first..."
    python scripts/improved_scraper.py
fi

# Test 2: Check Node dependencies
echo ""
echo "📦 Test 2: Checking Node dependencies..."
if [ -f "package.json" ]; then
    echo "✅ package.json found"
    if [ -d "node_modules" ]; then
        echo "✅ node_modules exists"
    else
        echo "⚠️  node_modules not found. Run 'npm install' first"
    fi
else
    echo "❌ package.json not found"
fi

# Test 3: Check backend structure
echo ""
echo "🔧 Test 3: Checking backend structure..."
if [ -f "server/server.js" ]; then
    echo "✅ Backend server.js exists"
fi

if [ -f "server/controllers/scrapedController.js" ]; then
    echo "✅ Scraped controller exists"
fi

if [ -f "server/routes/hackathons.js" ]; then
    echo "✅ Hackathon routes exist"
fi

# Test 4: Check frontend components
echo ""
echo "🎨 Test 4: Checking frontend components..."
if [ -f "src/components/HackathonCard.tsx" ]; then
    echo "✅ HackathonCard component exists"
fi

if [ -f "src/components/Dashboard.tsx" ]; then
    echo "✅ Dashboard component exists"
fi

if [ -f "src/services/api.ts" ]; then
    echo "✅ API service exists"
fi

# Test 5: Show sample scraped data
echo ""
echo "📊 Test 5: Sample scraped data preview..."
if [ -f "data/hackathons_dynamic.json" ]; then
    echo "First hackathon from scraped data:"
    jq '.[0] | {title: .title, organizer: .organizer, prize: .prize, source: .source}' data/hackathons_dynamic.json 2>/dev/null || echo "Could not parse JSON"
fi

echo ""
echo "🎯 INTEGRATION STATUS SUMMARY"
echo "=============================="

# Check if we have all required files
REQUIRED_FILES=(
    "scripts/improved_scraper.py"
    "server/controllers/scrapedController.js"
    "src/components/HackathonCard.tsx"
    "src/components/Dashboard.tsx"
    "src/services/api.ts"
)

MISSING=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing: $file"
        MISSING=$((MISSING + 1))
    fi
done

if [ $MISSING -eq 0 ]; then
    echo "✅ All integration files present"
else
    echo "⚠️  $MISSING files missing"
fi

echo ""
echo "🚀 NEXT STEPS:"
echo "1. Run the scraper: python scripts/improved_scraper.py"
echo "2. Start backend: cd server && npm run dev"
echo "3. Start frontend: npm run dev"
echo "4. Open browser to http://localhost:5173"
echo "5. Check 'Live from Unstop' tab for scraped data"

echo ""
echo "✨ Integration setup complete!"
@echo off
echo 🚀 HACKATHON SCRAPER INTEGRATION TEST
echo =====================================

REM Test 1: Check if scraped data exists
echo.
echo 📁 Test 1: Checking scraped data files...
if exist "data\hackathons_dynamic.json" (
    echo ✅ hackathons_dynamic.json exists
    echo    → Check the file for scraped hackathons
) else (
    echo ❌ No scraped data found. Running scraper...
    python scripts\improved_scraper.py
)

REM Test 2: Check Node dependencies
echo.
echo 📦 Test 2: Checking Node dependencies...
if exist "package.json" (
    echo ✅ package.json found
    if exist "node_modules" (
        echo ✅ node_modules exists
    ) else (
        echo ⚠️  node_modules not found. Run 'npm install' first
    )
) else (
    echo ❌ package.json not found
)

REM Test 3: Check backend structure
echo.
echo 🔧 Test 3: Checking backend structure...
if exist "server\server.js" (
    echo ✅ Backend server.js exists
)

if exist "server\controllers\scrapedController.js" (
    echo ✅ Scraped controller exists
)

if exist "server\routes\hackathons.js" (
    echo ✅ Hackathon routes exist
)

REM Test 4: Check frontend components
echo.
echo 🎨 Test 4: Checking frontend components...
if exist "src\components\HackathonCard.tsx" (
    echo ✅ HackathonCard component exists
)

if exist "src\components\Dashboard.tsx" (
    echo ✅ Dashboard component exists
)

if exist "src\services\api.ts" (
    echo ✅ API service exists
)

REM Test 5: Show integration status
echo.
echo 🎯 INTEGRATION STATUS SUMMARY
echo ==============================

set MISSING=0

if not exist "scripts\improved_scraper.py" (
    echo ❌ Missing: scripts\improved_scraper.py
    set /a MISSING+=1
)

if not exist "server\controllers\scrapedController.js" (
    echo ❌ Missing: server\controllers\scrapedController.js
    set /a MISSING+=1
)

if not exist "src\components\HackathonCard.tsx" (
    echo ❌ Missing: src\components\HackathonCard.tsx
    set /a MISSING+=1
)

if not exist "src\components\Dashboard.tsx" (
    echo ❌ Missing: src\components\Dashboard.tsx
    set /a MISSING+=1
)

if not exist "src\services\api.ts" (
    echo ❌ Missing: src\services\api.ts
    set /a MISSING+=1
)

if %MISSING%==0 (
    echo ✅ All integration files present
) else (
    echo ⚠️  %MISSING% files missing
)

echo.
echo 🚀 NEXT STEPS:
echo 1. Run the scraper: python scripts\improved_scraper.py
echo 2. Install dependencies: npm install
echo 3. Start backend: cd server ^&^& npm run dev
echo 4. Start frontend: npm run dev
echo 5. Open browser to http://localhost:5173
echo 6. Check 'Live from Unstop' tab for scraped data

echo.
echo ✨ Integration setup complete!
pause
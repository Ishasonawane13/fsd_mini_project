const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Enable CORS
app.use(cors({
    origin: 'http://localhost:8081',
    credentials: true
}));

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'Test server is running!',
        timestamp: new Date().toISOString()
    });
});

// Scraped hackathons endpoint
app.get('/api/hackathons/scraped', (req, res) => {
    try {
        console.log('Scraped hackathons endpoint called');

        // Path to scraped data file
        const dataPath = path.join(process.cwd(), '..', 'data', 'hackathons_dynamic.json');
        const simplePath = path.join(process.cwd(), '..', 'data', 'hackathons_simple.json');

        console.log('Looking for data at:', dataPath);
        console.log('File exists:', fs.existsSync(dataPath));

        let scrapedData = [];

        // Try to read the detailed data first, then fallback to simple
        if (fs.existsSync(dataPath)) {
            const rawData = fs.readFileSync(dataPath, 'utf8');
            scrapedData = JSON.parse(rawData);
            console.log('Loaded detailed data, count:', scrapedData.length);
        } else if (fs.existsSync(simplePath)) {
            const rawData = fs.readFileSync(simplePath, 'utf8');
            scrapedData = JSON.parse(rawData);
            console.log('Loaded simple data, count:', scrapedData.length);
        } else {
            // Return sample data if no scraped data exists
            scrapedData = [
                {
                    id: 1,
                    title: "Sample Hackathon - No Data Found",
                    description: "No scraped data available. Run the scraper first to get real data from Unstop.",
                    startDate: "2024-11-01",
                    endDate: "2024-11-30",
                    location: "Online",
                    status: "Open",
                    source: "Unstop",
                    scraped_at: new Date().toISOString()
                }
            ];
            console.log('Using sample data');
        }

        // Simple response without pagination for now
        const response = {
            success: true,
            data: {
                hackathons: scrapedData,
                totalCount: scrapedData.length,
                currentPage: 1,
                totalPages: 1,
                source: 'scraped',
                lastUpdated: scrapedData.length > 0 ? (scrapedData[0].scraped_at || new Date().toISOString()) : new Date().toISOString()
            },
            message: 'Scraped hackathons retrieved successfully'
        };

        console.log('Sending response with', scrapedData.length, 'hackathons');
        res.json(response);
    } catch (error) {
        console.error('Error in scraped endpoint:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// All sources endpoint
app.get('/api/hackathons/all-sources', (req, res) => {
    try {
        console.log('All sources endpoint called');

        // For now, just return scraped data since we don't have MongoDB running
        const dataPath = path.join(process.cwd(), '..', 'data', 'hackathons_dynamic.json');
        let scrapedData = [];

        if (fs.existsSync(dataPath)) {
            const rawData = fs.readFileSync(dataPath, 'utf8');
            scrapedData = JSON.parse(rawData);
        }

        const response = {
            success: true,
            data: {
                hackathons: scrapedData,
                totalCount: scrapedData.length,
                sources: {
                    database: 0,
                    scraped: scrapedData.length,
                    total: scrapedData.length
                }
            },
            message: 'All hackathons retrieved successfully'
        };

        res.json(response);
    } catch (error) {
        console.error('Error in all-sources endpoint:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Default hackathons endpoint
app.get('/api/hackathons', (req, res) => {
    res.json({
        success: true,
        data: {
            hackathons: [],
            totalCount: 0
        },
        message: 'No database hackathons (MongoDB not connected)'
    });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Scraped data: http://localhost:${PORT}/api/hackathons/scraped`);
});
const fs = require('fs');
const path = require('path');
const {
    asyncHandler,
    sendSuccessResponse,
    ErrorHandler
} = require('../utils/errorHandler');

// @desc    Get scraped hackathons from JSON file
// @route   GET /api/hackathons/scraped
// @access  Public
const getScrapedHackathons = asyncHandler(async (req, res) => {
    try {
        // Path to scraped data file
        const dataPath = path.join(process.cwd(), '..', 'data', 'hackathons_dynamic.json');
        const simplePath = path.join(process.cwd(), '..', 'data', 'hackathons_simple.json');

        let scrapedData = [];

        // Try to read the detailed data first, then fallback to simple
        if (fs.existsSync(dataPath)) {
            const rawData = fs.readFileSync(dataPath, 'utf8');
            scrapedData = JSON.parse(rawData);
        } else if (fs.existsSync(simplePath)) {
            const rawData = fs.readFileSync(simplePath, 'utf8');
            scrapedData = JSON.parse(rawData);
        } else {
            // Return sample data if no scraped data exists
            scrapedData = [
                {
                    id: 1,
                    title: "Sample Hackathon",
                    description: "No scraped data available. Run the scraper first.",
                    startDate: "2024-11-01",
                    endDate: "2024-11-30",
                    location: "Online",
                    status: "Open",
                    source: "Unstop",
                    scraped_at: new Date().toISOString()
                }
            ];
        }

        // Apply filters from query parameters
        const {
            page = 1,
            limit = 10,
            search,
            category,
            status,
            location
        } = req.query;

        let filteredData = scrapedData;

        // Apply search filter
        if (search) {
            filteredData = filteredData.filter(hackathon =>
                hackathon.title.toLowerCase().includes(search.toLowerCase()) ||
                (hackathon.description && hackathon.description.toLowerCase().includes(search.toLowerCase())) ||
                (hackathon.organizer && hackathon.organizer.toLowerCase().includes(search.toLowerCase()))
            );
        }

        // Apply category filter
        if (category) {
            filteredData = filteredData.filter(hackathon =>
                hackathon.category && hackathon.category.toLowerCase() === category.toLowerCase()
            );
        }

        // Apply status filter
        if (status) {
            filteredData = filteredData.filter(hackathon =>
                hackathon.status && hackathon.status.toLowerCase() === status.toLowerCase()
            );
        }

        // Apply location filter
        if (location) {
            filteredData = filteredData.filter(hackathon =>
                hackathon.location && hackathon.location.toLowerCase().includes(location.toLowerCase())
            );
        }

        // Pagination
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        const paginatedData = filteredData.slice(startIndex, endIndex);

        // Response with pagination info
        const response = {
            hackathons: paginatedData,
            totalCount: filteredData.length,
            currentPage: parseInt(page),
            totalPages: Math.ceil(filteredData.length / parseInt(limit)),
            hasNextPage: endIndex < filteredData.length,
            hasPrevPage: startIndex > 0,
            source: 'scraped',
            lastUpdated: scrapedData.length > 0 ? scrapedData[0].scraped_at : new Date().toISOString()
        };

        sendSuccessResponse(res, 'Scraped hackathons retrieved successfully', response);
    } catch (error) {
        throw new ErrorHandler(`Error reading scraped data: ${error.message}`, 500);
    }
});

// @desc    Get combined hackathons (database + scraped)
// @route   GET /api/hackathons/all-sources
// @access  Public
const getAllHackathons = asyncHandler(async (req, res) => {
    try {
        const Hackathon = require('../models/Hackathon');

        // Get database hackathons
        const dbHackathons = await Hackathon.find({}).lean();

        // Get scraped hackathons
        const dataPath = path.join(process.cwd(), '..', 'data', 'hackathons_dynamic.json');
        let scrapedHackathons = [];

        if (fs.existsSync(dataPath)) {
            const rawData = fs.readFileSync(dataPath, 'utf8');
            scrapedHackathons = JSON.parse(rawData);
        }

        // Transform scraped data to match database schema
        const transformedScraped = scrapedHackathons.map(item => ({
            _id: `scraped_${item.id}`,
            title: item.title,
            description: item.description,
            startDate: item.startDate,
            endDate: item.endDate,
            location: {
                type: 'online',
                address: item.location || 'Online'
            },
            organizer: {
                name: item.organizer || 'Unstop',
                email: 'contact@unstop.com'
            },
            prize: item.prize || 'N/A',
            status: item.status || 'open',
            category: item.category || 'technology',
            difficulty: item.difficulty || 'intermediate',
            teamSize: {
                min: 1,
                max: 4
            },
            featured: item.featured || false,
            registrationDeadline: item.deadline,
            createdAt: item.scraped_at,
            updatedAt: item.scraped_at,
            source: 'scraped'
        }));

        // Add source field to database hackathons
        const dbWithSource = dbHackathons.map(item => ({
            ...item,
            source: 'database'
        }));

        // Combine all hackathons
        const allHackathons = [...dbWithSource, ...transformedScraped];

        // Apply filters and pagination
        const {
            page = 1,
            limit = 10,
            search,
            source
        } = req.query;

        let filteredData = allHackathons;

        // Filter by source
        if (source) {
            filteredData = filteredData.filter(hackathon =>
                hackathon.source === source
            );
        }

        // Search filter
        if (search) {
            filteredData = filteredData.filter(hackathon =>
                hackathon.title.toLowerCase().includes(search.toLowerCase()) ||
                hackathon.description.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Sort by creation date (newest first)
        filteredData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Pagination
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        const paginatedData = filteredData.slice(startIndex, endIndex);

        const response = {
            hackathons: paginatedData,
            totalCount: filteredData.length,
            currentPage: parseInt(page),
            totalPages: Math.ceil(filteredData.length / parseInt(limit)),
            hasNextPage: endIndex < filteredData.length,
            hasPrevPage: startIndex > 0,
            sources: {
                database: dbWithSource.length,
                scraped: transformedScraped.length,
                total: allHackathons.length
            }
        };

        sendSuccessResponse(res, 'All hackathons retrieved successfully', response);
    } catch (error) {
        throw new ErrorHandler(`Error retrieving all hackathons: ${error.message}`, 500);
    }
});

module.exports = {
    getScrapedHackathons,
    getAllHackathons
};
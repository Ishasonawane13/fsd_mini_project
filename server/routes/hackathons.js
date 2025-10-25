const express = require('express');
const { auth, authorize, optionalAuth } = require('../middleware/auth');
const { handleValidationErrors } = require('../utils/errorHandler');
const { hackathonValidations, validationRules } = require('../utils/validations');
const {
    getHackathons,
    getHackathon,
    createHackathon,
    updateHackathon,
    deleteHackathon,
    getFeaturedHackathons,
    getUpcomingHackathons,
    searchHackathons,
    getHackathonStats
} = require('../controllers/hackathonController');

const router = express.Router();

// Routes are organized by access level for better readability

// All routes are now public (authentication removed)
router.get('/stats', getHackathonStats);
router.get('/featured', getFeaturedHackathons);
router.get('/upcoming', getUpcomingHackathons);
router.get('/scraped', require('../controllers/scrapedController').getScrapedHackathons);
router.get('/all-sources', require('../controllers/scrapedController').getAllHackathons);
router.get('/search', searchHackathons);
router.get('/:id', getHackathon);
router.get('/', getHackathons);

// CRUD operations - now public (no authentication required)
router.post('/', hackathonValidations.create, handleValidationErrors, createHackathon);
router.put('/:id', validationRules.mongoId(), hackathonValidations.update, handleValidationErrors, updateHackathon);
router.delete('/:id', validationRules.mongoId(), handleValidationErrors, deleteHackathon);

module.exports = router;

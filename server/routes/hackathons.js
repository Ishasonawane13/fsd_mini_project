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

// Public routes
router.get('/stats', getHackathonStats);
router.get('/featured', getFeaturedHackathons);
router.get('/upcoming', getUpcomingHackathons);
router.get('/search', searchHackathons);
router.get('/:id', optionalAuth, getHackathon);
router.get('/', optionalAuth, getHackathons);

// Protected routes - require authentication
router.post('/', auth, authorize('organizer', 'admin'), hackathonValidations.create, handleValidationErrors, createHackathon);
router.put('/:id', auth, validationRules.mongoId(), hackathonValidations.update, handleValidationErrors, updateHackathon);
router.delete('/:id', auth, validationRules.mongoId(), handleValidationErrors, deleteHackathon);

module.exports = router;

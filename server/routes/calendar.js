const express = require('express');
const router = express.Router();
const {
    addToCalendar,
    removeFromCalendar,
    getCalendarHackathons,
    isInCalendar
} = require('../controllers/calendarController');

// GET /api/calendar - Get all hackathons in user's calendar
router.get('/', getCalendarHackathons);

// POST /api/calendar - Add hackathon to calendar
router.post('/', addToCalendar);

// DELETE /api/calendar/:hackathonId - Remove hackathon from calendar
router.delete('/:hackathonId', removeFromCalendar);

// GET /api/calendar/:hackathonId - Check if hackathon is in calendar
router.get('/:hackathonId', isInCalendar);

module.exports = router;
const UserCalendar = require('../models/UserCalendar');
const Hackathon = require('../models/Hackathon');

// Add hackathon to user's calendar
const addToCalendar = async (req, res) => {
    try {
        const { hackathonId } = req.body;
        const userId = 'default_user'; // For now, using default user

        if (!hackathonId) {
            return res.status(400).json({ error: 'hackathonId is required' });
        }

        // Create new calendar entry (will fail if already exists due to unique index)
        const calendarEntry = new UserCalendar({
            userId,
            hackathonId
        });

        await calendarEntry.save();

        res.status(201).json({
            success: true,
            message: 'Hackathon added to calendar',
            data: calendarEntry
        });

    } catch (error) {
        if (error.code === 11000) {
            // Duplicate key error - hackathon already in calendar
            return res.status(409).json({
                success: false,
                error: 'Hackathon already in calendar'
            });
        }

        console.error('Error adding to calendar:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add hackathon to calendar'
        });
    }
};

// Remove hackathon from user's calendar
const removeFromCalendar = async (req, res) => {
    try {
        const { hackathonId } = req.params;
        const userId = 'default_user'; // For now, using default user

        if (!hackathonId) {
            return res.status(400).json({ error: 'hackathonId is required' });
        }

        const result = await UserCalendar.findOneAndDelete({
            userId,
            hackathonId
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Hackathon not found in calendar'
            });
        }

        res.json({
            success: true,
            message: 'Hackathon removed from calendar'
        });

    } catch (error) {
        console.error('Error removing from calendar:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove hackathon from calendar'
        });
    }
};

// Get all hackathons in user's calendar
const getCalendarHackathons = async (req, res) => {
    try {
        const userId = 'default_user'; // For now, using default user

        const calendarEntries = await UserCalendar.find({ userId }).sort({ addedAt: -1 });

        // Extract just the hackathon IDs
        const hackathonIds = calendarEntries.map(entry => entry.hackathonId);

        // Fetch full hackathon documents for these IDs
        const hackathons = await Hackathon.find({ _id: { $in: hackathonIds } }).lean();

        // Preserve order according to hackathonIds
        const hackathonMap = new Map(hackathons.map(h => [String(h._id), h]));
        const orderedHackathons = hackathonIds.map(id => hackathonMap.get(String(id))).filter(Boolean);

        res.json({
            success: true,
            data: {
                hackathonIds,
                count: hackathonIds.length,
                hackathons: orderedHackathons
            }
        });

    } catch (error) {
        console.error('Error fetching calendar hackathons:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch calendar hackathons'
        });
    }
};

// Check if hackathon is in user's calendar
const isInCalendar = async (req, res) => {
    try {
        const { hackathonId } = req.params;
        const userId = 'default_user'; // For now, using default user

        const entry = await UserCalendar.findOne({ userId, hackathonId });

        res.json({
            success: true,
            data: {
                isInCalendar: !!entry
            }
        });

    } catch (error) {
        console.error('Error checking calendar status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check calendar status'
        });
    }
};

module.exports = {
    addToCalendar,
    removeFromCalendar,
    getCalendarHackathons,
    isInCalendar
};
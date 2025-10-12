const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
const getUserProfile = async (req, res) => {
    try {
        const User = require('../models/User');

        const user = await User.findById(req.params.id)
            .populate('hackathonsParticipated.hackathon', 'title startDate endDate status')
            .populate('hackathonsOrganized', 'title startDate endDate status');

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Only return public information
        const publicProfile = {
            id: user._id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            profilePicture: user.profilePicture,
            bio: user.bio,
            skills: user.skills,
            interests: user.interests,
            experience: user.experience,
            location: user.location,
            socialLinks: user.socialLinks,
            hackathonsParticipated: user.hackathonsParticipated,
            hackathonsOrganized: user.hackathonsOrganized,
            achievements: user.achievements,
            createdAt: user.createdAt
        };

        res.json({
            status: 'success',
            data: { user: publicProfile }
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// @desc    Get all users (for search/discovery)
// @route   GET /api/users
// @access  Public
const getUsers = async (req, res) => {
    try {
        const User = require('../models/User');

        const { page = 1, limit = 10, search, skills, experience } = req.query;

        // Build filter object
        const filter = { isActive: true };

        if (search) {
            filter.$text = { $search: search };
        }

        if (skills) {
            filter['skills.name'] = { $in: skills.split(',') };
        }

        if (experience) {
            filter.experience = experience;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const users = await User.find(filter)
            .select('username firstName lastName profilePicture bio skills experience location')
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(filter);

        res.json({
            status: 'success',
            data: {
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// Routes
router.get('/:id', getUserProfile);
router.get('/', getUsers);

module.exports = router;

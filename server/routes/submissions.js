const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @desc    Create a submission
// @route   POST /api/submissions
// @access  Private
const createSubmission = async (req, res) => {
    try {
        const Submission = require('../models/Submission');
        const Hackathon = require('../models/Hackathon');
        const Team = require('../models/Team');

        const { hackathon, team, title, description, technologies, repositoryUrl } = req.body;

        // Verify hackathon exists
        const hackathonExists = await Hackathon.findById(hackathon);
        if (!hackathonExists) {
            return res.status(404).json({
                status: 'error',
                message: 'Hackathon not found'
            });
        }

        // Verify team exists
        const teamExists = await Team.findById(team);
        if (!teamExists) {
            return res.status(404).json({
                status: 'error',
                message: 'Team not found'
            });
        }

        const submission = await Submission.create({
            hackathon,
            team,
            title,
            description,
            technologies,
            repositoryUrl,
            ...req.body
        });

        await submission.populate([
            { path: 'hackathon', select: 'title' },
            { path: 'team', select: 'name' }
        ]);

        res.status(201).json({
            status: 'success',
            message: 'Submission created successfully',
            data: { submission }
        });
    } catch (error) {
        console.error('Create submission error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// @desc    Get submissions for a hackathon
// @route   GET /api/submissions/hackathon/:hackathonId
// @access  Public
const getSubmissionsByHackathon = async (req, res) => {
    try {
        const Submission = require('../models/Submission');

        const submissions = await Submission.find({
            hackathon: req.params.hackathonId,
            isPublic: true
        })
            .populate('team', 'name')
            .populate('hackathon', 'title')
            .sort({ submittedAt: -1 });

        res.json({
            status: 'success',
            data: { submissions }
        });
    } catch (error) {
        console.error('Get submissions by hackathon error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// @desc    Get single submission
// @route   GET /api/submissions/:id
// @access  Public
const getSubmission = async (req, res) => {
    try {
        const Submission = require('../models/Submission');

        const submission = await Submission.findById(req.params.id)
            .populate('team', 'name members leader')
            .populate('hackathon', 'title startDate endDate')
            .populate('scores.judge', 'username firstName lastName');

        if (!submission) {
            return res.status(404).json({
                status: 'error',
                message: 'Submission not found'
            });
        }

        // Increment view count
        submission.views += 1;
        await submission.save();

        res.json({
            status: 'success',
            data: { submission }
        });
    } catch (error) {
        console.error('Get submission error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// @desc    Update submission
// @route   PUT /api/submissions/:id
// @access  Private
const updateSubmission = async (req, res) => {
    try {
        const Submission = require('../models/Submission');

        const submission = await Submission.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate('team', 'name')
            .populate('hackathon', 'title');

        if (!submission) {
            return res.status(404).json({
                status: 'error',
                message: 'Submission not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Submission updated successfully',
            data: { submission }
        });
    } catch (error) {
        console.error('Update submission error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// @desc    Delete submission
// @route   DELETE /api/submissions/:id
// @access  Private
const deleteSubmission = async (req, res) => {
    try {
        const Submission = require('../models/Submission');

        const submission = await Submission.findByIdAndDelete(req.params.id);

        if (!submission) {
            return res.status(404).json({
                status: 'error',
                message: 'Submission not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Submission deleted successfully'
        });
    } catch (error) {
        console.error('Delete submission error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// @desc    Get all submissions
// @route   GET /api/submissions
// @access  Public
const getSubmissions = async (req, res) => {
    try {
        const Submission = require('../models/Submission');

        const { page = 1, limit = 10, hackathon, team } = req.query;

        const filter = { isPublic: true };
        if (hackathon) filter.hackathon = hackathon;
        if (team) filter.team = team;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const submissions = await Submission.find(filter)
            .populate('team', 'name')
            .populate('hackathon', 'title')
            .sort({ submittedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Submission.countDocuments(filter);

        res.json({
            status: 'success',
            data: {
                submissions,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get submissions error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// Routes
router.get('/hackathon/:hackathonId', getSubmissionsByHackathon);
router.get('/:id', getSubmission);
router.get('/', getSubmissions);
router.post('/', auth, createSubmission);
router.put('/:id', auth, updateSubmission);
router.delete('/:id', auth, deleteSubmission);

module.exports = router;

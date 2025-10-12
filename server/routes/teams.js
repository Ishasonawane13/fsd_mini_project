const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @desc    Create a team
// @route   POST /api/teams
// @access  Private
const createTeam = async (req, res) => {
    try {
        const Team = require('../models/Team');
        const Hackathon = require('../models/Hackathon');

        const { name, hackathon, description, maxMembers, lookingFor, tags } = req.body;

        // Verify hackathon exists
        const hackathonExists = await Hackathon.findById(hackathon);
        if (!hackathonExists) {
            return res.status(404).json({
                status: 'error',
                message: 'Hackathon not found'
            });
        }

        // Check if user already has a team for this hackathon
        const existingTeam = await Team.findOne({
            hackathon,
            $or: [
                { leader: req.user.id },
                { 'members.user': req.user.id }
            ]
        });

        if (existingTeam) {
            return res.status(400).json({
                status: 'error',
                message: 'You are already part of a team for this hackathon'
            });
        }

        const team = await Team.create({
            name,
            hackathon,
            leader: req.user.id,
            description,
            maxMembers,
            lookingFor,
            tags
        });

        await team.populate([
            { path: 'leader', select: 'username firstName lastName profilePicture' },
            { path: 'hackathon', select: 'title startDate endDate' }
        ]);

        res.status(201).json({
            status: 'success',
            message: 'Team created successfully',
            data: { team }
        });
    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// @desc    Get teams for a hackathon
// @route   GET /api/teams/hackathon/:hackathonId
// @access  Public
const getTeamsByHackathon = async (req, res) => {
    try {
        const Team = require('../models/Team');

        const teams = await Team.find({ hackathon: req.params.hackathonId })
            .populate('leader', 'username firstName lastName profilePicture')
            .populate('members.user', 'username firstName lastName profilePicture')
            .populate('hackathon', 'title');

        res.json({
            status: 'success',
            data: { teams }
        });
    } catch (error) {
        console.error('Get teams by hackathon error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// @desc    Join a team
// @route   POST /api/teams/:id/join
// @access  Private
const joinTeam = async (req, res) => {
    try {
        const Team = require('../models/Team');

        const team = await Team.findById(req.params.id);

        if (!team) {
            return res.status(404).json({
                status: 'error',
                message: 'Team not found'
            });
        }

        // Check if team is open
        if (!team.isOpen) {
            return res.status(400).json({
                status: 'error',
                message: 'Team is not accepting new members'
            });
        }

        // Check if team is full
        if (team.isFull) {
            return res.status(400).json({
                status: 'error',
                message: 'Team is full'
            });
        }

        // Check if user is already in this team
        const isAlreadyMember = team.members.some(member =>
            member.user.toString() === req.user.id
        ) || team.leader.toString() === req.user.id;

        if (isAlreadyMember) {
            return res.status(400).json({
                status: 'error',
                message: 'You are already a member of this team'
            });
        }

        // Check if user already has a team for this hackathon
        const existingTeam = await Team.findOne({
            hackathon: team.hackathon,
            $or: [
                { leader: req.user.id },
                { 'members.user': req.user.id }
            ]
        });

        if (existingTeam) {
            return res.status(400).json({
                status: 'error',
                message: 'You are already part of a team for this hackathon'
            });
        }

        // Add user to team
        team.members.push({
            user: req.user.id,
            joinedAt: new Date()
        });

        await team.save();

        await team.populate([
            { path: 'leader', select: 'username firstName lastName profilePicture' },
            { path: 'members.user', select: 'username firstName lastName profilePicture' },
            { path: 'hackathon', select: 'title' }
        ]);

        res.json({
            status: 'success',
            message: 'Successfully joined the team',
            data: { team }
        });
    } catch (error) {
        console.error('Join team error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// @desc    Leave a team
// @route   POST /api/teams/:id/leave
// @access  Private
const leaveTeam = async (req, res) => {
    try {
        const Team = require('../models/Team');

        const team = await Team.findById(req.params.id);

        if (!team) {
            return res.status(404).json({
                status: 'error',
                message: 'Team not found'
            });
        }

        // Check if user is the leader
        if (team.leader.toString() === req.user.id) {
            return res.status(400).json({
                status: 'error',
                message: 'Team leader cannot leave the team. Transfer leadership or delete the team.'
            });
        }

        // Remove user from team
        team.members = team.members.filter(member =>
            member.user.toString() !== req.user.id
        );

        await team.save();

        res.json({
            status: 'success',
            message: 'Successfully left the team'
        });
    } catch (error) {
        console.error('Leave team error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// @desc    Get team details
// @route   GET /api/teams/:id
// @access  Public
const getTeam = async (req, res) => {
    try {
        const Team = require('../models/Team');

        const team = await Team.findById(req.params.id)
            .populate('leader', 'username firstName lastName profilePicture bio skills')
            .populate('members.user', 'username firstName lastName profilePicture bio skills')
            .populate('hackathon', 'title startDate endDate status');

        if (!team) {
            return res.status(404).json({
                status: 'error',
                message: 'Team not found'
            });
        }

        res.json({
            status: 'success',
            data: { team }
        });
    } catch (error) {
        console.error('Get team error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// Routes
router.post('/', auth, createTeam);
router.get('/hackathon/:hackathonId', getTeamsByHackathon);
router.post('/:id/join', auth, joinTeam);
router.post('/:id/leave', auth, leaveTeam);
router.get('/:id', getTeam);

module.exports = router;

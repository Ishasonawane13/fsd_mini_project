const Hackathon = require('../models/Hackathon');
const {
    asyncHandler,
    sendSuccessResponse,
    sendPaginatedResponse,
    ErrorHandler
} = require('../utils/errorHandler');
const {
    findWithPagination,
    findByIdWithPopulate,
    updateById,
    deleteById,
    buildSearchFilter
} = require('../utils/dbHelpers');

// @desc    Get all hackathons
// @route   GET /api/hackathons
// @access  Public
const getHackathons = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        category,
        difficulty,
        status,
        location,
        featured,
        search,
        sortBy = 'startDate',
        sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (status) filter.status = status;
    if (location) filter['location.type'] = location;
    if (featured !== undefined) filter.featured = featured === 'true';

    // Text search
    if (search) {
        filter.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Use helper function for pagination
    const result = await findWithPagination(Hackathon, filter, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        populate: { path: 'createdBy', select: 'username firstName lastName' }
    });

    sendPaginatedResponse(res, { hackathons: result.items }, result.pagination, 'Hackathons retrieved successfully');
});

// @desc    Get single hackathon
// @route   GET /api/hackathons/:id
// @access  Public
const getHackathon = asyncHandler(async (req, res) => {
    const populate = [
        { path: 'createdBy', select: 'username firstName lastName profilePicture' },
        { path: 'updatedBy', select: 'username firstName lastName' }
    ];

    const hackathon = await findByIdWithPopulate(Hackathon, req.params.id, populate);

    // Increment view count if user is not the creator
    if (!req.user || req.user.id !== hackathon.createdBy._id.toString()) {
        hackathon.views += 1;
        await hackathon.save();
    }

    sendSuccessResponse(res, { hackathon }, 'Hackathon retrieved successfully');
});

// @desc    Create hackathon
// @route   POST /api/hackathons
// @access  Private (organizer/admin)
const createHackathon = asyncHandler(async (req, res) => {
    // Add creator to hackathon data
    const hackathonData = {
        ...req.body,
        createdBy: req.user.id
    };

    const hackathon = await Hackathon.create(hackathonData);

    // Add to user's organized hackathons
    req.user.hackathonsOrganized.push(hackathon._id);
    await req.user.save();

    // Populate creator info
    await hackathon.populate('createdBy', 'username firstName lastName');

    sendSuccessResponse(res, { hackathon }, 'Hackathon created successfully', 201);
});

// @desc    Update hackathon
// @route   PUT /api/hackathons/:id
// @access  Private (creator/admin)
const updateHackathon = asyncHandler(async (req, res) => {
    const hackathon = await findByIdWithPopulate(Hackathon, req.params.id);

    // Check if user is creator or admin
    if (hackathon.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
        throw new ErrorHandler('Access denied. You can only update your own hackathons.', 403);
    }

    // Update hackathon
    const updatedHackathon = await updateById(Hackathon, req.params.id, {
        ...req.body,
        updatedBy: req.user.id,
        updatedAt: new Date()
    });

    await updatedHackathon.populate('createdBy updatedBy', 'username firstName lastName');

    sendSuccessResponse(res, { hackathon: updatedHackathon }, 'Hackathon updated successfully');
});

// @desc    Delete hackathon
// @route   DELETE /api/hackathons/:id
// @access  Private (creator/admin)
const deleteHackathon = asyncHandler(async (req, res) => {
    const hackathon = await findByIdWithPopulate(Hackathon, req.params.id);

    // Check if user is creator or admin
    if (hackathon.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
        throw new ErrorHandler('Access denied. You can only delete your own hackathons.', 403);
    }

    await deleteById(Hackathon, req.params.id);

    // Remove from user's organized hackathons
    req.user.hackathonsOrganized.pull(req.params.id);
    await req.user.save();

    sendSuccessResponse(res, null, 'Hackathon deleted successfully');
});

// @desc    Get featured hackathons
// @route   GET /api/hackathons/featured
// @access  Public
const getFeaturedHackathons = async (req, res) => {
    try {
        const hackathons = await Hackathon.find({ featured: true })
            .populate('createdBy', 'username firstName lastName')
            .sort({ startDate: 1 })
            .limit(6);

        res.json({
            status: 'success',
            data: { hackathons }
        });
    } catch (error) {
        console.error('Get featured hackathons error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// @desc    Get upcoming hackathons
// @route   GET /api/hackathons/upcoming
// @access  Public
const getUpcomingHackathons = async (req, res) => {
    try {
        const now = new Date();
        const hackathons = await Hackathon.find({
            startDate: { $gt: now },
            status: 'upcoming'
        })
            .populate('createdBy', 'username firstName lastName')
            .sort({ startDate: 1 })
            .limit(10);

        res.json({
            status: 'success',
            data: { hackathons }
        });
    } catch (error) {
        console.error('Get upcoming hackathons error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// @desc    Search hackathons
// @route   GET /api/hackathons/search
// @access  Public
const searchHackathons = async (req, res) => {
    try {
        const { q, category, difficulty, location } = req.query;

        if (!q) {
            return res.status(400).json({
                status: 'error',
                message: 'Search query is required'
            });
        }

        const filter = {
            $text: { $search: q }
        };

        if (category) filter.category = category;
        if (difficulty) filter.difficulty = difficulty;
        if (location) filter['location.type'] = location;

        const hackathons = await Hackathon.find(filter, { score: { $meta: 'textScore' } })
            .populate('createdBy', 'username firstName lastName')
            .sort({ score: { $meta: 'textScore' } })
            .limit(20);

        res.json({
            status: 'success',
            data: { hackathons }
        });
    } catch (error) {
        console.error('Search hackathons error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// @desc    Get hackathon statistics
// @route   GET /api/hackathons/stats
// @access  Public
const getHackathonStats = async (req, res) => {
    try {
        const stats = await Hackathon.aggregate([
            {
                $group: {
                    _id: null,
                    totalHackathons: { $sum: 1 },
                    upcomingHackathons: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'upcoming'] }, 1, 0]
                        }
                    },
                    ongoingHackathons: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'ongoing'] }, 1, 0]
                        }
                    },
                    completedHackathons: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        const categoryStats = await Hackathon.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({
            status: 'success',
            data: {
                overview: stats[0] || {
                    totalHackathons: 0,
                    upcomingHackathons: 0,
                    ongoingHackathons: 0,
                    completedHackathons: 0
                },
                byCategory: categoryStats
            }
        });
    } catch (error) {
        console.error('Get hackathon stats error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

module.exports = {
    getHackathons,
    getHackathon,
    createHackathon,
    updateHackathon,
    deleteHackathon,
    getFeaturedHackathons,
    getUpcomingHackathons,
    searchHackathons,
    getHackathonStats
};

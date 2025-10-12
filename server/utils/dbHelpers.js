// Database query utilities
const { ErrorHandler } = require('./errorHandler');

// Generic pagination helper
const getPaginationParams = (query) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

// Generic search helper
const buildSearchFilter = (searchTerm, searchFields) => {
    if (!searchTerm) return {};

    return {
        $or: searchFields.map(field => ({
            [field]: { $regex: searchTerm, $options: 'i' }
        }))
    };
};

// Generic find with pagination
const findWithPagination = async (Model, filter = {}, options = {}) => {
    const {
        page = 1,
        limit = 10,
        sort = { createdAt: -1 },
        populate = null,
        select = null
    } = options;

    const skip = (page - 1) * limit;

    let query = Model.find(filter);

    if (select) query = query.select(select);
    if (populate) {
        if (Array.isArray(populate)) {
            populate.forEach(pop => query = query.populate(pop));
        } else {
            query = query.populate(populate);
        }
    }

    const [items, total] = await Promise.all([
        query.sort(sort).skip(skip).limit(limit),
        Model.countDocuments(filter)
    ]);

    return {
        items,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
        }
    };
};

// Generic find by ID with population
const findByIdWithPopulate = async (Model, id, populate = null) => {
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new ErrorHandler('Invalid ID format', 400);
    }

    let query = Model.findById(id);

    if (populate) {
        if (Array.isArray(populate)) {
            populate.forEach(pop => query = query.populate(pop));
        } else {
            query = query.populate(populate);
        }
    }

    const item = await query;

    if (!item) {
        throw new ErrorHandler(`${Model.modelName} not found`, 404);
    }

    return item;
};

// Generic update with validation
const updateById = async (Model, id, updateData, options = {}) => {
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new ErrorHandler('Invalid ID format', 400);
    }

    const item = await Model.findByIdAndUpdate(
        id,
        updateData,
        {
            new: true,
            runValidators: true,
            ...options
        }
    );

    if (!item) {
        throw new ErrorHandler(`${Model.modelName} not found`, 404);
    }

    return item;
};

// Generic delete by ID
const deleteById = async (Model, id) => {
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new ErrorHandler('Invalid ID format', 400);
    }

    const item = await Model.findByIdAndDelete(id);

    if (!item) {
        throw new ErrorHandler(`${Model.modelName} not found`, 404);
    }

    return item;
};

module.exports = {
    getPaginationParams,
    buildSearchFilter,
    findWithPagination,
    findByIdWithPopulate,
    updateById,
    deleteById
};
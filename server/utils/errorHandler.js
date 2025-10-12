// Centralized error handling utility
class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Standard error response format
const sendErrorResponse = (res, error, statusCode = 500) => {
    console.error('Error:', error);

    res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
};

// Success response format
const sendSuccessResponse = (res, data, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({
        status: 'success',
        message,
        data
    });
};

// Pagination response format
const sendPaginatedResponse = (res, data, pagination, message = 'Success') => {
    res.json({
        status: 'success',
        message,
        data,
        pagination
    });
};

// Async wrapper to catch errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

module.exports = {
    ErrorHandler,
    sendErrorResponse,
    sendSuccessResponse,
    sendPaginatedResponse,
    asyncHandler,
    handleValidationErrors
};
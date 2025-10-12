const { body, param, query } = require('express-validator');

// Common validation rules
const validationRules = {
    // ID validation
    mongoId: (field = 'id') => param(field).isMongoId().withMessage('Invalid ID format'),

    // String validations
    requiredString: (field, minLength = 1, maxLength = 255) =>
        body(field)
            .notEmpty()
            .trim()
            .isLength({ min: minLength, max: maxLength })
            .withMessage(`${field} is required and must be between ${minLength} and ${maxLength} characters`),

    optionalString: (field, maxLength = 255) =>
        body(field)
            .optional()
            .trim()
            .isLength({ max: maxLength })
            .withMessage(`${field} must not exceed ${maxLength} characters`),

    // Email validation
    email: () =>
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email'),

    // Password validation
    password: (minLength = 6) =>
        body('password')
            .isLength({ min: minLength })
            .withMessage(`Password must be at least ${minLength} characters long`),

    // Username validation
    username: () =>
        body('username')
            .isLength({ min: 3, max: 30 })
            .withMessage('Username must be between 3 and 30 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores'),

    // Date validation
    date: (field) =>
        body(field)
            .isISO8601()
            .toDate()
            .withMessage(`Valid ${field} is required`),

    // Date range validation
    dateRange: (startField, endField) =>
        body(endField)
            .custom((value, { req }) => {
                if (new Date(value) <= new Date(req.body[startField])) {
                    throw new Error(`${endField} must be after ${startField}`);
                }
                return true;
            }),

    // Enum validation
    enum: (field, values) =>
        body(field)
            .isIn(values)
            .withMessage(`Invalid ${field}. Must be one of: ${values.join(', ')}`),

    // Numeric validation
    positiveInteger: (field, min = 1) =>
        body(field)
            .isInt({ min })
            .withMessage(`${field} must be a positive integer (minimum ${min})`),

    // Array validation
    stringArray: (field) =>
        body(field)
            .optional()
            .isArray()
            .withMessage(`${field} must be an array`)
            .custom((value) => {
                if (value && !value.every(item => typeof item === 'string')) {
                    throw new Error(`All items in ${field} must be strings`);
                }
                return true;
            }),

    // URL validation
    url: (field) =>
        body(field)
            .optional()
            .isURL()
            .withMessage(`${field} must be a valid URL`),

    // Query parameter validations
    paginationQuery: () => [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
    ]
};

// Specific validation sets for different entities
const hackathonValidations = {
    create: [
        validationRules.requiredString('title', 1, 200),
        validationRules.requiredString('description', 1, 2000),
        validationRules.requiredString('organizer'),
        validationRules.enum('category', ['AI/ML', 'Web Development', 'Mobile Development', 'Blockchain', 'IoT', 'Game Development', 'Data Science', 'Cybersecurity', 'Design', 'Other']),
        validationRules.enum('difficulty', ['Beginner', 'Intermediate', 'Advanced']),
        validationRules.date('startDate'),
        validationRules.date('endDate'),
        validationRules.date('registrationDeadline'),
        validationRules.dateRange('startDate', 'endDate'),
        body('registrationDeadline').custom((value, { req }) => {
            if (new Date(value) > new Date(req.body.startDate)) {
                throw new Error('Registration deadline must be before or on start date');
            }
            return true;
        }),
        validationRules.enum('location.type', ['online', 'offline', 'hybrid']),
        validationRules.positiveInteger('teamSize.min', 1),
        validationRules.positiveInteger('teamSize.max', 1),
        body('teamSize.max').custom((value, { req }) => {
            if (value < req.body['teamSize.min']) {
                throw new Error('Maximum team size must be greater than or equal to minimum team size');
            }
            return true;
        }),
        validationRules.stringArray('tags'),
        validationRules.url('links.website')
    ],

    update: [
        validationRules.mongoId(),
        validationRules.optionalString('title', 200),
        validationRules.optionalString('description', 2000),
        validationRules.optionalString('organizer'),
        body('category').optional().isIn(['AI/ML', 'Web Development', 'Mobile Development', 'Blockchain', 'IoT', 'Game Development', 'Data Science', 'Cybersecurity', 'Design', 'Other']),
        body('difficulty').optional().isIn(['Beginner', 'Intermediate', 'Advanced']),
        body('startDate').optional().isISO8601().toDate(),
        body('endDate').optional().isISO8601().toDate(),
        body('registrationDeadline').optional().isISO8601().toDate(),
        validationRules.stringArray('tags'),
        validationRules.url('links.website')
    ]
};

const authValidations = {
    register: [
        validationRules.username(),
        validationRules.email(),
        validationRules.password(6),
        validationRules.requiredString('firstName', 1, 50),
        validationRules.requiredString('lastName', 1, 50)
    ],

    login: [
        validationRules.email(),
        validationRules.requiredString('password', 1, 255)
    ],

    changePassword: [
        validationRules.requiredString('currentPassword', 1, 255),
        validationRules.password(6, 'newPassword')
    ],

    forgotPassword: [
        validationRules.email()
    ],

    resetPassword: [
        validationRules.password(6)
    ]
};

const teamValidations = {
    create: [
        validationRules.requiredString('name', 1, 100),
        validationRules.mongoId('hackathon'),
        validationRules.optionalString('description', 500),
        validationRules.positiveInteger('maxMembers', 2),
        validationRules.stringArray('lookingFor'),
        validationRules.stringArray('tags')
    ]
};

const submissionValidations = {
    create: [
        validationRules.mongoId('hackathon'),
        validationRules.mongoId('team'),
        validationRules.requiredString('title', 1, 200),
        validationRules.requiredString('description', 1, 2000),
        validationRules.stringArray('technologies'),
        validationRules.url('repositoryUrl')
    ]
};

module.exports = {
    validationRules,
    hackathonValidations,
    authValidations,
    teamValidations,
    submissionValidations
};
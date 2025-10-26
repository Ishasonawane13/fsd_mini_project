const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

dotenv.config();

const app = express();

// Trust proxy for rate limiting and forwarded headers
app.set('trust proxy', 1);

connectDB();

app.use(helmet());

app.use(cors({
    origin: process.env.CLIENT_URL || ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:5173'],
    credentials: true
}));

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 1000, // Allow 1000 requests per window 
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    trustProxy: true
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

app.use('/api/hackathons', require('./routes/hackathons'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/users', require('./routes/users'));
app.use('/api/calendar', require('./routes/calendar'));

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is running!',
        timestamp: new Date().toISOString()
    });
});

app.use('/api', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'API endpoint not found'
    });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            status: 'error',
            message: 'Validation Error',
            errors
        });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            status: 'error',
            message: `${field} already exists`
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            status: 'error',
            message: 'Token expired'
        });
    }

    // Default error
    res.status(err.statusCode || 500).json({
        status: 'error',
        message: err.message || 'Internal server error'
    });
});

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`API Health: http://localhost:${PORT}/api/health`);
    console.log(`Server listening on all interfaces`);
});

server.on('error', (err) => {
    console.error('Server error:', err);
});

server.on('listening', () => {
    console.log('Server listening event fired');
});

module.exports = app;

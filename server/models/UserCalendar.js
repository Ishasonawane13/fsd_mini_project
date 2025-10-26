const mongoose = require('mongoose');

const userCalendarSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        default: 'default_user' // For now, using a default user since we don't have authentication
    },
    hackathonId: {
        type: String,
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create compound index to ensure unique hackathon per user
userCalendarSchema.index({ userId: 1, hackathonId: 1 }, { unique: true });

module.exports = mongoose.model('UserCalendar', userCalendarSchema);
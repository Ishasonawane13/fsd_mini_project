const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Team name is required'],
        trim: true,
        maxlength: [100, 'Team name cannot exceed 100 characters']
    },
    hackathon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hackathon',
        required: [true, 'Hackathon reference is required']
    },
    leader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Team leader is required']
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        role: {
            type: String,
            default: 'member'
        }
    }],
    description: {
        type: String,
        maxlength: [500, 'Team description cannot exceed 500 characters']
    },
    lookingFor: [{
        skill: String,
        description: String
    }],
    project: {
        name: String,
        description: String,
        technologies: [String],
        githubRepo: {
            type: String,
            validate: {
                validator: function (v) {
                    return !v || /^https?:\/\/(www\.)?github\.com\/.+/.test(v);
                },
                message: 'GitHub repository must be a valid GitHub URL'
            }
        },
        demoUrl: {
            type: String,
            validate: {
                validator: function (v) {
                    return !v || /^https?:\/\/.+/.test(v);
                },
                message: 'Demo URL must be a valid URL'
            }
        },
        submissionUrl: String,
        submittedAt: Date
    },
    maxMembers: {
        type: Number,
        min: 2,
        max: 10,
        default: 4
    },
    isOpen: {
        type: Boolean,
        default: true
    },
    inviteCode: {
        type: String,
        unique: true
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    achievements: [{
        title: String,
        description: String,
        position: Number,
        prize: {
            amount: Number,
            currency: String
        },
        date: Date
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual fields
teamSchema.virtual('currentSize').get(function () {
    return this.members.length + 1; // +1 for leader
});

teamSchema.virtual('spotsLeft').get(function () {
    return this.maxMembers - this.currentSize;
});

teamSchema.virtual('isFull').get(function () {
    return this.currentSize >= this.maxMembers;
});

// Indexes
teamSchema.index({ hackathon: 1 });
teamSchema.index({ leader: 1 });
teamSchema.index({ isOpen: 1 });
teamSchema.index({ inviteCode: 1 });
teamSchema.index({ createdAt: -1 });

// Text index for search
teamSchema.index({
    name: 'text',
    description: 'text',
    tags: 'text'
});

// Pre-save middleware to generate invite code
teamSchema.pre('save', function (next) {
    if (!this.inviteCode) {
        this.inviteCode = require('crypto').randomBytes(6).toString('hex').toUpperCase();
    }
    next();
});

module.exports = mongoose.model('Team', teamSchema);

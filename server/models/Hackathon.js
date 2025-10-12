const mongoose = require('mongoose');

const hackathonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    organizer: {
        type: String,
        required: [true, 'Organizer is required'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['AI/ML', 'Web Development', 'Mobile Development', 'Blockchain', 'IoT', 'Game Development', 'Data Science', 'Cybersecurity', 'Design', 'Other']
    },
    difficulty: {
        type: String,
        required: [true, 'Difficulty is required'],
        enum: ['Beginner', 'Intermediate', 'Advanced']
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required'],
        validate: {
            validator: function (value) {
                return value > this.startDate;
            },
            message: 'End date must be after start date'
        }
    },
    registrationDeadline: {
        type: Date,
        required: [true, 'Registration deadline is required'],
        validate: {
            validator: function (value) {
                return value <= this.startDate;
            },
            message: 'Registration deadline must be before or on start date'
        }
    },
    location: {
        type: {
            type: String,
            enum: ['online', 'offline', 'hybrid'],
            required: true
        },
        venue: {
            type: String,
            required: function () {
                return this.location.type === 'offline' || this.location.type === 'hybrid';
            }
        },
        address: {
            street: String,
            city: String,
            state: String,
            country: String,
            zipCode: String
        },
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    prizes: [{
        position: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'USD'
        },
        description: String
    }],
    maxParticipants: {
        type: Number,
        min: [1, 'Maximum participants must be at least 1']
    },
    currentParticipants: {
        type: Number,
        default: 0,
        min: 0
    },
    teamSize: {
        min: {
            type: Number,
            default: 1,
            min: 1
        },
        max: {
            type: Number,
            default: 4,
            min: 1
        }
    },
    technologies: [{
        type: String,
        trim: true
    }],
    requirements: [{
        type: String,
        trim: true
    }],
    judging: {
        criteria: [{
            name: String,
            weight: Number,
            description: String
        }],
        judges: [{
            name: String,
            title: String,
            company: String,
            bio: String
        }]
    },
    sponsors: [{
        name: {
            type: String,
            required: true
        },
        logo: String,
        website: String,
        tier: {
            type: String,
            enum: ['Title', 'Platinum', 'Gold', 'Silver', 'Bronze', 'Partner']
        }
    }],
    links: {
        website: {
            type: String,
            validate: {
                validator: function (v) {
                    return !v || /^https?:\/\/.+/.test(v);
                },
                message: 'Website must be a valid URL'
            }
        },
        registration: {
            type: String,
            validate: {
                validator: function (v) {
                    return !v || /^https?:\/\/.+/.test(v);
                },
                message: 'Registration link must be a valid URL'
            }
        },
        discord: String,
        slack: String,
        github: String
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    featured: {
        type: Boolean,
        default: false
    },
    verified: {
        type: Boolean,
        default: false
    },
    submissionGuidelines: {
        type: String,
        maxlength: [1000, 'Submission guidelines cannot exceed 1000 characters']
    },
    schedule: [{
        date: Date,
        title: String,
        description: String,
        startTime: String,
        endTime: String
    }],
    faqs: [{
        question: String,
        answer: String
    }],
    contactInfo: {
        email: {
            type: String,
            validate: {
                validator: function (v) {
                    return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
                },
                message: 'Please enter a valid email'
            }
        },
        phone: String,
        social: {
            twitter: String,
            linkedin: String,
            instagram: String
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual fields
hackathonSchema.virtual('isRegistrationOpen').get(function () {
    return new Date() < this.registrationDeadline;
});

hackathonSchema.virtual('daysUntilStart').get(function () {
    const now = new Date();
    const start = new Date(this.startDate);
    const diffTime = start - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

hackathonSchema.virtual('duration').get(function () {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = end - start;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Indexes for better query performance
hackathonSchema.index({ startDate: 1 });
hackathonSchema.index({ category: 1 });
hackathonSchema.index({ status: 1 });
hackathonSchema.index({ featured: 1 });
hackathonSchema.index({ tags: 1 });
hackathonSchema.index({ 'location.type': 1 });
hackathonSchema.index({ createdAt: -1 });

// Text index for search functionality
hackathonSchema.index({
    title: 'text',
    description: 'text',
    organizer: 'text',
    tags: 'text'
});

// Pre-save middleware
hackathonSchema.pre('save', function (next) {
    // Update status based on dates
    const now = new Date();
    if (now < this.startDate) {
        this.status = 'upcoming';
    } else if (now >= this.startDate && now <= this.endDate) {
        this.status = 'ongoing';
    } else if (now > this.endDate) {
        this.status = 'completed';
    }

    next();
});

module.exports = mongoose.model('Hackathon', hackathonSchema);

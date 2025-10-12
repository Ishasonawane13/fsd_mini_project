const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    hackathon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hackathon',
        required: [true, 'Hackathon reference is required']
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: [true, 'Team reference is required']
    },
    title: {
        type: String,
        required: [true, 'Project title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Project description is required'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    technologies: [{
        type: String,
        required: true,
        trim: true
    }],
    category: {
        type: String,
        required: [true, 'Category is required']
    },
    repositoryUrl: {
        type: String,
        required: [true, 'Repository URL is required'],
        validate: {
            validator: function (v) {
                return /^https?:\/\/(www\.)?(github|gitlab|bitbucket)\.com\/.+/.test(v);
            },
            message: 'Repository URL must be a valid Git repository URL'
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
    videoUrl: {
        type: String,
        validate: {
            validator: function (v) {
                return !v || /^https?:\/\/(www\.)?(youtube|vimeo|loom)\.com\/.+/.test(v);
            },
            message: 'Video URL must be a valid video platform URL'
        }
    },
    presentationUrl: {
        type: String,
        validate: {
            validator: function (v) {
                return !v || /^https?:\/\/.+/.test(v);
            },
            message: 'Presentation URL must be a valid URL'
        }
    },
    images: [{
        url: {
            type: String,
            required: true,
            validate: {
                validator: function (v) {
                    return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
                },
                message: 'Image URL must be a valid image URL'
            }
        },
        caption: String,
        isMain: {
            type: Boolean,
            default: false
        }
    }],
    features: [{
        title: String,
        description: String
    }],
    challenges: [{
        challenge: String,
        solution: String
    }],
    nextSteps: [{
        type: String,
        trim: true
    }],
    inspiration: {
        type: String,
        maxlength: [1000, 'Inspiration cannot exceed 1000 characters']
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    submittedAt: {
        type: Date,
        default: Date.now
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    scores: [{
        judge: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        criteria: [{
            name: String,
            score: {
                type: Number,
                min: 0,
                max: 10
            },
            comments: String
        }],
        overallScore: {
            type: Number,
            min: 0,
            max: 10
        },
        feedback: String,
        submittedAt: {
            type: Date,
            default: Date.now
        }
    }],
    finalRanking: {
        position: Number,
        totalSubmissions: Number,
        prize: {
            title: String,
            amount: Number,
            currency: String
        }
    },
    likes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        likedAt: {
            type: Date,
            default: Date.now
        }
    }],
    views: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['draft', 'submitted', 'under_review', 'reviewed', 'winner'],
        default: 'submitted'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual fields
submissionSchema.virtual('averageScore').get(function () {
    if (!this.scores || this.scores.length === 0) return 0;

    const totalScore = this.scores.reduce((sum, score) => sum + score.overallScore, 0);
    return totalScore / this.scores.length;
});

submissionSchema.virtual('likeCount').get(function () {
    return this.likes ? this.likes.length : 0;
});

submissionSchema.virtual('isWinner').get(function () {
    return this.finalRanking && this.finalRanking.position <= 3;
});

// Indexes
submissionSchema.index({ hackathon: 1 });
submissionSchema.index({ team: 1 });
submissionSchema.index({ submittedAt: -1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ 'finalRanking.position': 1 });
submissionSchema.index({ views: -1 });

// Text index for search
submissionSchema.index({
    title: 'text',
    description: 'text',
    technologies: 'text',
    tags: 'text'
});

// Compound indexes
submissionSchema.index({ hackathon: 1, submittedAt: -1 });
submissionSchema.index({ hackathon: 1, 'finalRanking.position': 1 });

module.exports = mongoose.model('Submission', submissionSchema);

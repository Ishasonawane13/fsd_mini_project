const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: 'Please enter a valid email'
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    profilePicture: {
        type: String,
        validate: {
            validator: function (v) {
                return !v || /^https?:\/\/.+/.test(v);
            },
            message: 'Profile picture must be a valid URL'
        }
    },
    bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    role: {
        type: String,
        enum: ['user', 'organizer', 'admin'],
        default: 'user'
    },
    skills: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        level: {
            type: String,
            enum: ['Beginner', 'Intermediate', 'Advanced'],
            default: 'Beginner'
        }
    }],
    interests: [{
        type: String,
        trim: true
    }],
    experience: {
        type: String,
        enum: ['Student', '0-1 years', '1-3 years', '3-5 years', '5+ years'],
        default: 'Student'
    },
    education: {
        institution: String,
        degree: String,
        fieldOfStudy: String,
        graduationYear: Number
    },
    location: {
        city: String,
        state: String,
        country: String
    },
    socialLinks: {
        github: {
            type: String,
            validate: {
                validator: function (v) {
                    return !v || /^https?:\/\/(www\.)?github\.com\/.+/.test(v);
                },
                message: 'GitHub link must be a valid GitHub URL'
            }
        },
        linkedin: {
            type: String,
            validate: {
                validator: function (v) {
                    return !v || /^https?:\/\/(www\.)?linkedin\.com\/.+/.test(v);
                },
                message: 'LinkedIn link must be a valid LinkedIn URL'
            }
        },
        twitter: {
            type: String,
            validate: {
                validator: function (v) {
                    return !v || /^https?:\/\/(www\.)?twitter\.com\/.+/.test(v);
                },
                message: 'Twitter link must be a valid Twitter URL'
            }
        },
        portfolio: {
            type: String,
            validate: {
                validator: function (v) {
                    return !v || /^https?:\/\/.+/.test(v);
                },
                message: 'Portfolio link must be a valid URL'
            }
        }
    },
    preferences: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        marketingEmails: {
            type: Boolean,
            default: false
        },
        profileVisibility: {
            type: String,
            enum: ['public', 'private'],
            default: 'public'
        }
    },
    hackathonsParticipated: [{
        hackathon: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hackathon'
        },
        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team'
        },
        role: {
            type: String,
            enum: ['leader', 'member']
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    hackathonsOrganized: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hackathon'
    }],
    achievements: [{
        title: String,
        description: String,
        date: Date,
        hackathon: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hackathon'
        }
    }],
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,
    loginCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.emailVerificationToken;
            delete ret.passwordResetToken;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// Virtual fields
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('hackathonStats').get(function () {
    return {
        participated: this.hackathonsParticipated.length,
        organized: this.hackathonsOrganized.length,
        achievements: this.achievements.length
    };
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Text index for search
userSchema.index({
    username: 'text',
    firstName: 'text',
    lastName: 'text',
    bio: 'text'
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    // Only hash password if it's been modified
    if (!this.isModified('password')) return next();

    try {
        // Hash password with cost of 12
        const hashedPassword = await bcrypt.hash(this.password, 12);
        this.password = hashedPassword;
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Instance method to generate password reset token
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = require('crypto').randomBytes(32).toString('hex');

    this.passwordResetToken = require('crypto')
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    return resetToken;
};

module.exports = mongoose.model('User', userSchema);

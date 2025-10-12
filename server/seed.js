const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Hackathon = require('./models/Hackathon');
const User = require('./models/User');

// Load environment variables
dotenv.config();

// First, let's create a dummy user to be the creator
async function createDummyUser() {
    const dummyUser = new User({
        username: 'admin',
        email: 'admin@hackathonhub.com',
        password: 'demo-password-change-in-production', // This will be hashed automatically
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
    });

    const savedUser = await dummyUser.save();
    return savedUser._id;
}

const createSampleHackathons = (createdBy) => [
    {
        title: "HackWithInfy 2025",
        description: "Join HackWithInfy 2025 and showcase your innovative solutions! Build cutting-edge technology solutions and compete for amazing prizes. This hackathon focuses on real-world problem solving using the latest technologies.",
        organizer: "Infosys Limited",
        category: "AI/ML",
        difficulty: "Intermediate",
        location: {
            type: "offline",
            venue: "Chennai",
            address: {
                city: "Chennai",
                state: "Tamil Nadu",
                country: "India"
            }
        },
        teamSize: {
            min: 1,
            max: 5
        },
        status: "upcoming",
        registrationDeadline: "2025-09-23T23:59:59.000Z",
        startDate: "2025-09-28T00:00:00.000Z",
        endDate: "2025-10-02T23:59:59.000Z",
        links: {
            website: "https://hackwithinfy.com"
        },
        prizes: [
            { position: "1st", amount: 350000, currency: "INR", description: "Winner" },
            { position: "2nd", amount: 150000, currency: "INR", description: "Runner Up" },
            { position: "3rd", amount: 50000, currency: "INR", description: "Second Runner Up" }
        ],
        tags: ["innovation", "technology", "hackathon", "competition"],
        requirements: [
            "Valid student ID or professional ID",
            "Team of 1-5 members",
            "Basic programming knowledge",
            "Laptop with development environment"
        ],
        createdBy
    },
    {
        title: "Smart India Hackathon 2025",
        description: "India's biggest hackathon for students to solve real-world problems faced by various government ministries and organizations. Contribute to Digital India initiative through innovative solutions.",
        organizer: "Government of India",
        category: "Web Development",
        difficulty: "Advanced",
        location: {
            type: "hybrid",
            venue: "Multiple Cities",
            address: {
                city: "Multiple Cities",
                state: "All States",
                country: "India"
            }
        },
        teamSize: {
            min: 6,
            max: 6
        },
        status: "upcoming",
        registrationDeadline: "2025-10-15T23:59:59.000Z",
        startDate: "2025-11-01T00:00:00.000Z",
        endDate: "2025-11-03T23:59:59.000Z",
        links: {
            website: "https://sih.gov.in"
        },
        prizes: [
            { position: "1st", amount: 1000000, currency: "INR", description: "Grand Prize" }
        ],
        tags: ["government", "social impact", "innovation", "student"],
        createdBy
    },
    {
        title: "TechCrunch Disrupt Hackathon",
        description: "Build the next unicorn startup in 48 hours! Join developers, designers, and entrepreneurs to create groundbreaking solutions. Focus on fintech, healthtech, edtech, and sustainability.",
        organizer: "TechCrunch",
        category: "Blockchain",
        difficulty: "Advanced",
        location: {
            type: "offline",
            venue: "San Francisco",
            address: {
                city: "San Francisco",
                state: "California",
                country: "USA"
            }
        },
        teamSize: {
            min: 2,
            max: 4
        },
        status: "upcoming",
        registrationDeadline: "2025-10-20T23:59:59.000Z",
        startDate: "2025-11-15T18:00:00.000Z",
        endDate: "2025-11-17T18:00:00.000Z",
        links: {
            website: "https://techcrunch.com/events"
        },
        prizes: [
            { position: "1st", amount: 100000, currency: "USD", description: "Grand Prize" }
        ],
        tags: ["startup", "innovation", "venture capital", "disrupt"],
        createdBy
    },
    {
        title: "DevFest Bangalore 2025",
        description: "Google's premier developer conference featuring workshops, talks, and a 24-hour hackathon. Focus on Android, Web, Cloud, and AI/ML technologies. Network with Google Developer Experts.",
        organizer: "Google Developer Groups Bangalore",
        category: "Mobile Development",
        difficulty: "Intermediate",
        location: {
            type: "offline",
            venue: "Bangalore",
            address: {
                city: "Bangalore",
                state: "Karnataka",
                country: "India"
            }
        },
        teamSize: {
            min: 1,
            max: 3
        },
        status: "upcoming",
        registrationDeadline: "2025-11-01T23:59:59.000Z",
        startDate: "2025-11-20T09:00:00.000Z",
        endDate: "2025-11-21T18:00:00.000Z",
        links: {
            website: "https://devfest.gdgbangalore.org"
        },
        prizes: [
            { position: "1st", amount: 200000, currency: "INR", description: "Winner" }
        ],
        tags: ["google", "android", "web", "cloud", "ai", "ml"],
        createdBy
    },
    {
        title: "HackMIT 2025",
        description: "MIT's premier hackathon bringing together the brightest minds to solve tomorrow's challenges. Focus on hardware, software, and everything in between. 36 hours of non-stop innovation.",
        organizer: "MIT",
        category: "Other",
        difficulty: "Advanced",
        location: {
            type: "offline",
            venue: "Cambridge, Massachusetts",
            address: {
                city: "Cambridge",
                state: "Massachusetts",
                country: "USA"
            }
        },
        teamSize: {
            min: 1,
            max: 4
        },
        status: "upcoming",
        registrationDeadline: "2025-10-10T23:59:59.000Z",
        startDate: "2025-10-25T19:00:00.000Z",
        endDate: "2025-10-27T07:00:00.000Z",
        links: {
            website: "https://hackmit.org"
        },
        prizes: [
            { position: "1st", amount: 50000, currency: "USD", description: "Grand Prize" }
        ],
        tags: ["mit", "hardware", "software", "innovation", "university"],
        createdBy
    },
    {
        title: "Flipkart GRiD 5.0",
        description: "India's largest tech challenge by Flipkart! Solve real-world e-commerce problems using cutting-edge technology. Multiple rounds including coding, machine learning, and product development.",
        organizer: "Flipkart",
        category: "Data Science",
        difficulty: "Advanced",
        location: {
            type: "online"
        },
        teamSize: {
            min: 2,
            max: 3
        },
        status: "ongoing",
        registrationDeadline: "2025-09-20T23:59:59.000Z",
        startDate: "2025-09-21T00:00:00.000Z",
        endDate: "2025-12-15T23:59:59.000Z",
        links: {
            website: "https://grid.flipkart.com"
        },
        prizes: [
            { position: "1st", amount: 5000000, currency: "INR", description: "Grand Prize" }
        ],
        tags: ["e-commerce", "machine learning", "product development", "flipkart"],
        createdBy
    },
    {
        title: "NASA Space Apps Challenge",
        description: "International hackathon using NASA's open data to address real-world problems on Earth and in space. Create solutions for challenges in Earth science, space exploration, and human spaceflight.",
        organizer: "NASA",
        category: "Data Science",
        difficulty: "Intermediate",
        location: {
            type: "hybrid",
            venue: "Global - Multiple Cities",
            address: {
                city: "Multiple Cities",
                state: "Global",
                country: "Multiple Countries"
            }
        },
        teamSize: {
            min: 1,
            max: 6
        },
        status: "upcoming",
        registrationDeadline: "2025-10-30T23:59:59.000Z",
        startDate: "2025-11-05T00:00:00.000Z",
        endDate: "2025-11-07T23:59:59.000Z",
        links: {
            website: "https://spaceappschallenge.org"
        },
        prizes: [
            { position: "1st", amount: 0, currency: "USD", description: "Global Recognition + NASA Mentorship" }
        ],
        tags: ["nasa", "space", "earth science", "global", "open data"],
        createdBy
    },
    {
        title: "Microsoft Imagine Cup 2025",
        description: "The world's premier student technology competition. Create technology solutions that make a positive impact on the world. Categories include AI for Good, Earth, Health, and Lifestyle.",
        organizer: "Microsoft",
        category: "AI/ML",
        difficulty: "Advanced",
        location: {
            type: "hybrid",
            venue: "Online + Finals in Seattle",
            address: {
                city: "Seattle",
                state: "Washington",
                country: "USA"
            }
        },
        teamSize: {
            min: 1,
            max: 3
        },
        status: "upcoming",
        registrationDeadline: "2026-01-15T23:59:59.000Z",
        startDate: "2026-02-01T00:00:00.000Z",
        endDate: "2026-05-30T23:59:59.000Z",
        links: {
            website: "https://imaginecup.microsoft.com"
        },
        prizes: [
            { position: "1st", amount: 100000, currency: "USD", description: "Grand Prize + Azure Credits" }
        ],
        tags: ["microsoft", "student", "ai", "social impact", "global"],
        createdBy
    },
    {
        title: "AngelHack Global Hackathon Series",
        description: "Join the world's most diverse developer community! Build solutions that matter and get connected with top tech companies. Focus on fintech, healthtech, and social impact solutions.",
        organizer: "AngelHack",
        category: "Web Development",
        difficulty: "Intermediate",
        location: {
            type: "offline",
            venue: "Mumbai",
            address: {
                city: "Mumbai",
                state: "Maharashtra",
                country: "India"
            }
        },
        teamSize: {
            min: 2,
            max: 5
        },
        status: "completed",
        registrationDeadline: "2025-08-15T23:59:59.000Z",
        startDate: "2025-08-20T10:00:00.000Z",
        endDate: "2025-08-22T18:00:00.000Z",
        links: {
            website: "https://angelhack.com"
        },
        prizes: [
            { position: "1st", amount: 300000, currency: "INR", description: "Winner" }
        ],
        tags: ["global", "community", "fintech", "healthtech", "social impact"],
        createdBy
    },
    {
        title: "AWS DeepRacer Championship",
        description: "Race into machine learning with AWS DeepRacer! Learn reinforcement learning through autonomous racing. Build, train, and race your ML models in this exciting competition.",
        organizer: "Amazon Web Services",
        category: "AI/ML",
        difficulty: "Beginner",
        location: {
            type: "online"
        },
        teamSize: {
            min: 1,
            max: 1
        },
        status: "upcoming",
        registrationDeadline: "2025-12-01T23:59:59.000Z",
        startDate: "2025-12-15T00:00:00.000Z",
        endDate: "2026-03-15T23:59:59.000Z",
        links: {
            website: "https://aws.amazon.com/deepracer"
        },
        prizes: [
            { position: "1st", amount: 20000, currency: "USD", description: "Grand Prize + AWS Credits" }
        ],
        tags: ["aws", "machine learning", "racing", "ai", "cloud"],
        createdBy
    }
];

// Connect to MongoDB and seed the database
async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hackathon-hub');
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await Hackathon.deleteMany({});
        await User.deleteMany({});
        console.log('✅ Cleared existing data');

        // Create a dummy user first
        const userId = await createDummyUser();
        console.log('✅ Created dummy user');

        // Create hackathons with the user ID
        const hackathonsData = createSampleHackathons(userId);

        // Insert sample hackathons
        const insertedHackathons = await Hackathon.insertMany(hackathonsData);
        console.log(`✅ Inserted ${insertedHackathons.length} sample hackathons`);

        // Display inserted hackathons
        insertedHackathons.forEach((hackathon, index) => {
            console.log(`${index + 1}. ${hackathon.title} by ${hackathon.organizer}`);
        });

        console.log('\n✅ Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

// Run the seed function
seedDatabase();

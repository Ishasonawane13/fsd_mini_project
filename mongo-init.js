// MongoDB initialization script for Docker
db = db.getSiblingDB('hackathon-hub');

// Create collections
db.createCollection('hackathons');
db.createCollection('users');
db.createCollection('teams');
db.createCollection('submissions');

// Create indexes for better performance
db.hackathons.createIndex({ "title": "text", "description": "text", "tags": "text" });
db.hackathons.createIndex({ "category": 1 });
db.hackathons.createIndex({ "status": 1 });
db.hackathons.createIndex({ "featured": 1 });
db.hackathons.createIndex({ "startDate": 1 });
db.hackathons.createIndex({ "registrationDeadline": 1 });

db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });

print('Database initialization completed successfully!');

// Insert sample hackathon data
db.hackathons.insertMany([
    {
        title: "AI Innovation Challenge 2025",
        description: "Build innovative AI solutions to solve real-world problems using cutting-edge machine learning techniques.",
        organizer: "Microsoft India",
        category: "AI/ML",
        difficulty: "Intermediate",
        location: {
            type: "hybrid",
            venue: "Mumbai & Online",
            address: {
                city: "Mumbai",
                state: "Maharashtra",
                country: "India"
            }
        },
        teamSize: { min: 1, max: 4 },
        status: "upcoming",
        registrationDeadline: new Date("2025-11-15T23:59:59.000Z"),
        startDate: new Date("2025-11-20T09:00:00.000Z"),
        endDate: new Date("2025-11-22T18:00:00.000Z"),
        prizes: [
            { position: "1st", amount: 500000, currency: "INR", description: "Winner" },
            { position: "2nd", amount: 300000, currency: "INR", description: "Runner Up" },
            { position: "3rd", amount: 150000, currency: "INR", description: "Second Runner Up" }
        ],
        tags: ["hackathon", "AI", "machine learning", "innovation", "technology"],
        views: 1250,
        featured: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        requirements: ["AI/ML experience", "Python programming"],
        judgingCriteria: ["Innovation", "Technical Implementation", "Impact", "Presentation"],
        links: { website: "https://unstop.com/hackathons/ai-innovation-challenge-2025" },
        currentParticipants: 0,
        technologies: ["Python", "TensorFlow", "PyTorch", "Azure AI"],
        verified: true
    },
    {
        title: "FinTech Revolution 2025",
        description: "Revolutionize financial services with blockchain technology and digital payments.",
        organizer: "Razorpay",
        category: "Blockchain",
        difficulty: "Advanced",
        location: {
            type: "offline",
            venue: "Bangalore Tech Park",
            address: {
                city: "Bangalore",
                state: "Karnataka",
                country: "India"
            }
        },
        teamSize: { min: 2, max: 5 },
        status: "upcoming",
        registrationDeadline: new Date("2025-10-25T23:59:59.000Z"),
        startDate: new Date("2025-11-01T09:00:00.000Z"),
        endDate: new Date("2025-11-03T18:00:00.000Z"),
        prizes: [
            { position: "1st", amount: 750000, currency: "INR", description: "Winner" },
            { position: "2nd", amount: 450000, currency: "INR", description: "Runner Up" },
            { position: "3rd", amount: 225000, currency: "INR", description: "Second Runner Up" }
        ],
        tags: ["hackathon", "fintech", "blockchain", "payments", "innovation"],
        views: 890,
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        requirements: ["Blockchain knowledge", "Solidity programming"],
        judgingCriteria: ["Innovation", "Security", "Scalability", "User Experience"],
        links: { website: "https://unstop.com/hackathons/fintech-revolution-2025" },
        currentParticipants: 0,
        technologies: ["Solidity", "Web3.js", "React", "Node.js"],
        verified: true
    }
]);

print('Sample data inserted successfully!');
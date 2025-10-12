const { MongoClient, ObjectId } = require('mongodb');

const sampleHackathons = [
    {
        title: "AI Innovation Challenge 2025",
        organizer: "Microsoft India",
        description: "Build innovative AI solutions to solve real-world problems using cutting-edge machine learning techniques. Participants will work with Azure AI services and create applications that can make a positive impact on society.",
        category: "AI/ML",
        difficulty: "Intermediate",
        registrationDeadline: new Date('2025-11-15'),
        startDate: new Date('2025-11-20'),
        endDate: new Date('2025-11-22'),
        status: "upcoming",
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
        links: {
            website: "https://unstop.com/hackathons/ai-innovation-challenge-2025"
        },
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
        createdBy: new ObjectId()
    },
    {
        title: "FinTech Revolution 2025",
        organizer: "Razorpay",
        description: "Revolutionize financial services with blockchain technology and digital payments. Build secure, scalable fintech solutions that can transform the banking industry.",
        category: "Blockchain",
        difficulty: "Advanced",
        registrationDeadline: new Date('2025-10-25'),
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-03'),
        status: "upcoming",
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
        links: {
            website: "https://unstop.com/hackathons/fintech-revolution-2025"
        },
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
        createdBy: new ObjectId()
    },
    {
        title: "Smart City Hackathon",
        organizer: "Government of India",
        description: "Design and develop smart city solutions using IoT, sensors, and data analytics. Create applications that can improve urban living through technology innovation.",
        category: "IoT",
        difficulty: "Beginner",
        registrationDeadline: new Date('2025-10-30'),
        startDate: new Date('2025-11-10'),
        endDate: new Date('2025-11-12'),
        status: "upcoming",
        location: {
            type: "online"
        },
        teamSize: { min: 1, max: 3 },
        links: {
            website: "https://unstop.com/hackathons/smart-city-hackathon"
        },
        prizes: [
            { position: "1st", amount: 300000, currency: "INR", description: "Winner" },
            { position: "2nd", amount: 180000, currency: "INR", description: "Runner Up" },
            { position: "3rd", amount: 90000, currency: "INR", description: "Second Runner Up" }
        ],
        tags: ["hackathon", "IoT", "smart city", "sensors", "innovation"],
        views: 2100,
        featured: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: new ObjectId()
    }
];

async function seedDatabase() {
    const client = new MongoClient('mongodb://localhost:27017');

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db('hackathon-hub');
        const collection = db.collection('hackathons');

        // Clear existing data
        await collection.deleteMany({});
        console.log('🗑️  Cleared existing hackathons');

        // Insert sample data
        const result = await collection.insertMany(sampleHackathons);
        console.log(`✅ Inserted ${result.insertedCount} hackathons`);

        // Verify insertion
        const count = await collection.countDocuments();
        console.log(`📊 Total hackathons in database: ${count}`);

        // Display inserted hackathons
        const hackathons = await collection.find({}).toArray();
        console.log('\n📋 Inserted hackathons:');
        hackathons.forEach((h, i) => {
            console.log(`  ${i + 1}. ${h.title} by ${h.organizer} (${h.status})`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

seedDatabase();
const { MongoClient } = require('mongodb');

// Additional hackathon data with more variety
const additionalHackathons = [
    {
        title: "Cybersecurity Challenge 2025",
        description: "Protect the digital world! Build innovative cybersecurity solutions to combat modern threats. Focus on ethical hacking, threat detection, and security automation.",
        organizer: "CyberArk",
        category: "Cybersecurity",
        difficulty: "Advanced",
        location: {
            type: "online",
            venue: "Virtual Platform"
        },
        teamSize: {
            min: 2,
            max: 4
        },
        status: "upcoming",
        registrationDeadline: new Date("2025-11-05T23:59:59.000Z"),
        startDate: new Date("2025-11-25T09:00:00.000Z"),
        endDate: new Date("2025-11-27T18:00:00.000Z"),
        prizes: [
            { position: "1st", amount: 600000, currency: "INR", description: "Winner" },
            { position: "2nd", amount: 350000, currency: "INR", description: "Runner Up" },
            { position: "3rd", amount: 200000, currency: "INR", description: "Second Runner Up" }
        ],
        tags: ["cybersecurity", "ethical-hacking", "threat-detection", "security"],
        views: 1456,
        featured: true,
        createdBy: null,
        requirements: ["Basic cybersecurity knowledge", "Programming skills in Python/C++"],
        judgingCriteria: ["Innovation", "Technical Implementation", "Security Impact", "Presentation"],
        links: {
            website: "https://cybersecurity-challenge.com",
            discord: "https://discord.gg/cybersec2025"
        },
        currentParticipants: 0,
        technologies: ["Python", "C++", "Kali Linux", "Wireshark"],
        verified: true
    },
    {
        title: "Web3 Gaming Revolution",
        description: "Create the future of gaming with blockchain technology. Build decentralized games, NFT marketplaces, or gaming DeFi protocols.",
        organizer: "Polygon Studios",
        category: "Game Development",
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
        teamSize: {
            min: 3,
            max: 6
        },
        status: "upcoming",
        registrationDeadline: new Date("2025-12-10T23:59:59.000Z"),
        startDate: new Date("2025-12-20T10:00:00.000Z"),
        endDate: new Date("2025-12-22T20:00:00.000Z"),
        prizes: [
            { position: "1st", amount: 800000, currency: "INR", description: "Winner + Incubation" },
            { position: "2nd", amount: 500000, currency: "INR", description: "Runner Up" },
            { position: "3rd", amount: 300000, currency: "INR", description: "Second Runner Up" },
            { position: "Special", amount: 150000, currency: "INR", description: "Best NFT Implementation" }
        ],
        tags: ["web3", "gaming", "blockchain", "nft", "defi"],
        views: 2340,
        featured: true,
        createdBy: null,
        requirements: ["Game development experience", "Basic blockchain knowledge"],
        judgingCriteria: ["Gameplay Innovation", "Blockchain Integration", "User Experience", "Scalability"],
        links: {
            website: "https://web3gaming.polygon.technology",
            discord: "https://discord.gg/polygongaming"
        },
        currentParticipants: 0,
        technologies: ["Solidity", "Unity", "React", "Web3.js"],
        verified: true
    },
    {
        title: "Healthcare AI Innovation",
        description: "Revolutionize healthcare with AI! Develop AI-powered solutions for diagnosis, treatment, patient care, or medical research.",
        organizer: "Apollo Hospitals",
        category: "AI/ML",
        difficulty: "Intermediate",
        location: {
            type: "offline",
            venue: "Apollo Health City",
            address: {
                city: "Hyderabad",
                state: "Telangana",
                country: "India"
            }
        },
        teamSize: {
            min: 2,
            max: 5
        },
        status: "upcoming",
        registrationDeadline: new Date("2025-11-20T23:59:59.000Z"),
        startDate: new Date("2025-12-05T08:00:00.000Z"),
        endDate: new Date("2025-12-07T17:00:00.000Z"),
        prizes: [
            { position: "1st", amount: 700000, currency: "INR", description: "Winner + Mentorship" },
            { position: "2nd", amount: 400000, currency: "INR", description: "Runner Up" },
            { position: "3rd", amount: 250000, currency: "INR", description: "Second Runner Up" }
        ],
        tags: ["healthcare", "ai", "medical", "diagnosis", "innovation"],
        views: 1890,
        featured: false,
        createdBy: null,
        requirements: ["Healthcare domain knowledge preferred", "ML/AI experience"],
        judgingCriteria: ["Medical Impact", "AI Innovation", "Feasibility", "Ethics"],
        links: {
            website: "https://apollohackathon.com"
        },
        currentParticipants: 0,
        technologies: ["Python", "TensorFlow", "scikit-learn", "OpenCV"],
        verified: true
    },
    {
        title: "Sustainable Tech Challenge",
        description: "Build technology solutions for a sustainable future. Focus on climate change, renewable energy, waste management, or environmental monitoring.",
        organizer: "Tata Consultancy Services",
        category: "Other",
        difficulty: "Beginner",
        location: {
            type: "online"
        },
        teamSize: {
            min: 1,
            max: 4
        },
        status: "upcoming",
        registrationDeadline: new Date("2025-12-15T23:59:59.000Z"),
        startDate: new Date("2025-12-28T09:00:00.000Z"),
        endDate: new Date("2025-12-30T18:00:00.000Z"),
        prizes: [
            { position: "1st", amount: 400000, currency: "INR", description: "Winner" },
            { position: "2nd", amount: 250000, currency: "INR", description: "Runner Up" },
            { position: "3rd", amount: 150000, currency: "INR", description: "Second Runner Up" }
        ],
        tags: ["sustainability", "climate", "renewable-energy", "environment"],
        views: 987,
        featured: false,
        createdBy: null,
        requirements: ["Passion for sustainability", "Basic programming knowledge"],
        judgingCriteria: ["Environmental Impact", "Innovation", "Scalability", "Presentation"],
        links: {
            website: "https://tcs-sustainability-hackathon.com"
        },
        currentParticipants: 0,
        technologies: ["IoT", "Data Analytics", "Mobile Development"],
        verified: false
    },
    {
        title: "EdTech Revolution 2025",
        description: "Transform education with technology! Create innovative learning platforms, assessment tools, or educational games for the digital age.",
        organizer: "BYJU'S",
        category: "Web Development",
        difficulty: "Intermediate",
        location: {
            type: "hybrid",
            venue: "Bangalore & Online",
            address: {
                city: "Bangalore",
                state: "Karnataka",
                country: "India"
            }
        },
        teamSize: {
            min: 2,
            max: 5
        },
        status: "upcoming",
        registrationDeadline: new Date("2025-11-30T23:59:59.000Z"),
        startDate: new Date("2025-12-15T10:00:00.000Z"),
        endDate: new Date("2025-12-17T19:00:00.000Z"),
        prizes: [
            { position: "1st", amount: 550000, currency: "INR", description: "Winner + Internship" },
            { position: "2nd", amount: 350000, currency: "INR", description: "Runner Up" },
            { position: "3rd", amount: 200000, currency: "INR", description: "Second Runner Up" }
        ],
        tags: ["edtech", "education", "learning", "web-development"],
        views: 1678,
        featured: true,
        createdBy: null,
        requirements: ["Web development skills", "Understanding of educational concepts"],
        judgingCriteria: ["Educational Value", "User Experience", "Technical Quality", "Innovation"],
        links: {
            website: "https://byjus-hackathon.com",
            slack: "https://byjus-hack.slack.com"
        },
        currentParticipants: 0,
        technologies: ["React", "Node.js", "MongoDB", "WebRTC"],
        verified: true
    },
    {
        title: "Mobile App Innovation Sprint",
        description: "Develop cutting-edge mobile applications that solve real-world problems. Focus on native or cross-platform solutions with great UX.",
        organizer: "Google Developer Groups",
        category: "Mobile Development",
        difficulty: "Intermediate",
        location: {
            type: "online"
        },
        teamSize: {
            min: 1,
            max: 3
        },
        status: "upcoming",
        registrationDeadline: new Date("2025-11-25T23:59:59.000Z"),
        startDate: new Date("2025-12-10T11:00:00.000Z"),
        endDate: new Date("2025-12-12T20:00:00.000Z"),
        prizes: [
            { position: "1st", amount: 450000, currency: "INR", description: "Winner" },
            { position: "2nd", amount: 275000, currency: "INR", description: "Runner Up" },
            { position: "3rd", amount: 175000, currency: "INR", description: "Second Runner Up" }
        ],
        tags: ["mobile", "android", "ios", "flutter", "react-native"],
        views: 1234,
        featured: false,
        createdBy: null,
        requirements: ["Mobile development experience", "Published app preferred"],
        judgingCriteria: ["App Functionality", "User Interface", "Innovation", "Market Potential"],
        links: {
            website: "https://gdg-mobile-hackathon.dev"
        },
        currentParticipants: 0,
        technologies: ["Flutter", "React Native", "Kotlin", "Swift"],
        verified: true
    }
];

async function addMoreHackathons() {
    const client = new MongoClient('mongodb://localhost:27017');

    try {
        await client.connect();
        console.log('🔗 Connected to MongoDB');

        const db = client.db('hackathon-hub');
        const hackathons = db.collection('hackathons');

        // Check current count
        const currentCount = await hackathons.countDocuments();
        console.log(`📊 Current hackathons in database: ${currentCount}`);

        // Add timestamps to new hackathons
        const hackathonsWithTimestamps = additionalHackathons.map(hackathon => ({
            ...hackathon,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        // Insert new hackathons
        const result = await hackathons.insertMany(hackathonsWithTimestamps);
        console.log(`✅ Successfully added ${result.insertedCount} new hackathons!`);

        // Show updated count
        const newCount = await hackathons.countDocuments();
        console.log(`📈 Total hackathons now: ${newCount}`);

        // Show summary of added hackathons
        console.log('\n🎯 Added Hackathons:');
        additionalHackathons.forEach((hackathon, index) => {
            console.log(`  ${index + 1}. ${hackathon.title}`);
            console.log(`     Organizer: ${hackathon.organizer}`);
            console.log(`     Category: ${hackathon.category}`);
            console.log(`     Location: ${hackathon.location.type}`);
            console.log(`     Prize Pool: INR ${hackathon.prizes[0].amount.toLocaleString()}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error adding hackathons:', error.message);
    } finally {
        await client.close();
        console.log('🔌 Connection closed');
    }
}

addMoreHackathons();
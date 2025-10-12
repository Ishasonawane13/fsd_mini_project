const { MongoClient } = require('mongodb');

async function testMongoDB() {
    const client = new MongoClient('mongodb://localhost:27017');

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db('hackathon-hub');
        const collection = db.collection('hackathons');

        const count = await collection.countDocuments();
        console.log(`📊 Total hackathons: ${count}`);

        if (count > 0) {
            const hackathons = await collection.find({}).limit(3).toArray();
            console.log('\n🎯 Sample hackathons:');
            hackathons.forEach((h, i) => {
                console.log(`  ${i + 1}. ${h.title} by ${h.organizer}`);
                console.log(`     Category: ${h.category} | Status: ${h.status}`);
                console.log(`     ID: ${h._id}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

testMongoDB();
const { MongoClient } = require('mongodb');

async function listDatabases() {
    const client = new MongoClient('mongodb://localhost:27017');

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        // List all databases
        const dbs = await client.db().admin().listDatabases();
        console.log('📋 Available databases:');
        dbs.databases.forEach(db => {
            console.log(`  - ${db.name}`);
        });

        // Check hackathon-hub database
        const db = client.db('hackathon-hub');
        const collections = await db.listCollections().toArray();
        console.log('\n📁 Collections in hackathon-hub:');
        collections.forEach(coll => {
            console.log(`  - ${coll.name}`);
        });

        // Check hackathons collection
        if (collections.some(c => c.name === 'hackathons')) {
            const hackathons = db.collection('hackathons');
            const count = await hackathons.countDocuments();
            console.log(`\n📊 Hackathons count: ${count}`);

            if (count > 0) {
                const sample = await hackathons.findOne();
                console.log('\n🎯 Sample hackathon:');
                console.log(JSON.stringify(sample, null, 2));
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

listDatabases();
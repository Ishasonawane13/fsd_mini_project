const { MongoClient } = require('mongodb');

async function exploreDatabase() {
    const client = new MongoClient('mongodb://localhost:27017');

    try {
        await client.connect();
        console.log('🔗 Connected to MongoDB');

        // List all databases
        const adminDb = client.db().admin();
        const databases = await adminDb.listDatabases();

        console.log('\n📁 Available Databases:');
        databases.databases.forEach(db => {
            console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
        });

        // Focus on our hackathon-hub database
        const db = client.db('hackathon-hub');

        // List all collections
        const collections = await db.listCollections().toArray();
        console.log('\n📚 Collections in hackathon-hub database:');
        collections.forEach(col => {
            console.log(`  - ${col.name}`);
        });

        // Get detailed stats for each collection
        for (const collection of collections) {
            const collectionObj = db.collection(collection.name);
            const count = await collectionObj.countDocuments();
            const sample = await collectionObj.findOne();

            console.log(`\n📊 Collection: ${collection.name}`);
            console.log(`   Documents: ${count}`);

            if (sample) {
                console.log(`   Sample document structure:`);
                console.log(`   - ID: ${sample._id}`);

                // Show key fields based on collection type
                if (collection.name === 'hackathons') {
                    console.log(`   - Title: ${sample.title || 'N/A'}`);
                    console.log(`   - Organizer: ${sample.organizer || 'N/A'}`);
                    console.log(`   - Category: ${sample.category || 'N/A'}`);
                    console.log(`   - Status: ${sample.status || 'N/A'}`);
                    console.log(`   - Start Date: ${sample.startDate || 'N/A'}`);
                    console.log(`   - Location Type: ${sample.location?.type || 'N/A'}`);
                } else if (collection.name === 'users') {
                    console.log(`   - Username: ${sample.username || 'N/A'}`);
                    console.log(`   - Email: ${sample.email || 'N/A'}`);
                    console.log(`   - Role: ${sample.role || 'N/A'}`);
                }

                console.log(`   - Created: ${sample.createdAt || 'N/A'}`);
            }
        }

        // Get specific hackathon data
        const hackathons = db.collection('hackathons');
        const allHackathons = await hackathons.find({}).toArray();

        console.log('\n🎯 All Hackathons in Database:');
        allHackathons.forEach((hackathon, index) => {
            console.log(`\n  ${index + 1}. ${hackathon.title}`);
            console.log(`     ID: ${hackathon._id}`);
            console.log(`     Organizer: ${hackathon.organizer}`);
            console.log(`     Category: ${hackathon.category}`);
            console.log(`     Status: ${hackathon.status}`);
            console.log(`     Team Size: ${hackathon.teamSize?.min || 1}-${hackathon.teamSize?.max || 1}`);
            console.log(`     Location: ${hackathon.location?.type || 'TBD'}`);
            console.log(`     Start: ${new Date(hackathon.startDate).toLocaleDateString()}`);
            console.log(`     End: ${new Date(hackathon.endDate).toLocaleDateString()}`);
            console.log(`     Views: ${hackathon.views || 0}`);
            console.log(`     Featured: ${hackathon.featured ? 'Yes' : 'No'}`);

            if (hackathon.prizes && hackathon.prizes.length > 0) {
                console.log(`     Prizes:`);
                hackathon.prizes.forEach(prize => {
                    console.log(`       - ${prize.position}: ${prize.currency} ${prize.amount.toLocaleString()}`);
                });
            }
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
        console.log('\n🔌 Connection closed');
    }
}

exploreDatabase();
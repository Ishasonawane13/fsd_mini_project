#!/usr/bin/env python3
from pymongo import MongoClient

try:
    client = MongoClient('mongodb://localhost:27017')
    db = client['hackathon-hub']
    collection = db.hackathons
    
    count = collection.count_documents({})
    print(f"📊 Total hackathons: {count}")
    
    if count > 0:
        print("\n🎯 Sample hackathons:")
        for i, hackathon in enumerate(collection.find().limit(5)):
            print(f"  {i+1}. {hackathon['title']} by {hackathon['organizer']}")
            print(f"     Category: {hackathon['category']} | Status: {hackathon['status']}")
            if hackathon.get('prizes'):
                print(f"     Prize: ₹{hackathon['prizes'][0]['amount']:,}")
            print()
    
    client.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
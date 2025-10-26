import json
import os
import sys
from datetime import datetime, timedelta
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://ishasonawane999:123hackplanner234@cluster0.3zjf6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
DB_NAME = 'hackathon_calendar'
COLLECTION_NAME = 'hackathons'
TRASH_COLLECTION_NAME = 'hackathons_trash'

class HackathonSyncManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.hackathons_collection = None
        self.trash_collection = None
        self.connect_to_mongodb()

    def connect_to_mongodb(self):
        """Connect to MongoDB"""
        try:
            self.client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
            # Test the connection
            self.client.admin.command('ping')
            self.db = self.client[DB_NAME]
            self.hackathons_collection = self.db[COLLECTION_NAME]
            self.trash_collection = self.db[TRASH_COLLECTION_NAME]

            # Create indexes for better performance
            self.hackathons_collection.create_index([('title', 1), ('location.venue', 1)], unique=False)
            self.hackathons_collection.create_index('status')
            self.hackathons_collection.create_index('registrationDeadline')
            self.trash_collection.create_index('deletedAt')

            logger.info("✅ Connected to MongoDB successfully")
        except ConnectionFailure:
            logger.error("❌ Failed to connect to MongoDB")
            sys.exit(1)

    def load_scraped_data(self):
        """Load scraped hackathon data from JSON file"""
        try:
            data_path = os.path.join(os.path.dirname(__file__), 'data', 'hackathons_dynamic.json')
            with open(data_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            logger.info(f"📁 Loaded {len(data)} hackathons from scraped data")
            return data
        except FileNotFoundError:
            logger.error("❌ Scraped data file not found. Run the scraper first.")
            return []
        except json.JSONDecodeError:
            logger.error("❌ Invalid JSON in scraped data file")
            return []

    def filter_expired_hackathons(self, hackathons):
        """Filter out expired hackathons, only keep ongoing/upcoming"""
        now = datetime.now()
        filtered = []

        for hackathon in hackathons:
            try:
                # Check if registration deadline exists and is in future
                deadline_str = hackathon.get('registrationDeadline')
                if deadline_str:
                    deadline = datetime.strptime(deadline_str, '%Y-%m-%d')
                    if deadline > now:
                        filtered.append(hackathon)
                else:
                    # If no deadline, assume it's upcoming
                    filtered.append(hackathon)
            except (ValueError, TypeError):
                # If date parsing fails, include it anyway
                filtered.append(hackathon)

        logger.info(f"🎯 Filtered to {len(filtered)} ongoing/upcoming hackathons (removed {len(hackathons) - len(filtered)} expired)")
        return filtered

    def find_duplicate_hackathon(self, title, location):
        """Check if hackathon already exists in database"""
        # Normalize location for comparison
        venue = location.get('venue', '') if isinstance(location, dict) else str(location)

        # Find by title and location (case-insensitive)
        existing = self.hackathons_collection.find_one({
            'title': {'$regex': f'^{re.escape(title)}$', '$options': 'i'},
            'location.venue': {'$regex': f'^{re.escape(venue)}$', '$options': 'i'},
            'status': {'$ne': 'trashed'}  # Don't match trashed items
        })

        return existing

    def update_hackathon_status(self, hackathon):
        """Update hackathon status based on current date"""
        now = datetime.now()

        try:
            # Parse dates
            start_date = datetime.strptime(hackathon['startDate'], '%Y-%m-%d')
            end_date = datetime.strptime(hackathon['endDate'], '%Y-%m-%d')
            reg_deadline = datetime.strptime(hackathon.get('registrationDeadline', hackathon['startDate']), '%Y-%m-%d')

            # Determine status
            if now > reg_deadline:
                new_status = 'registration_closed'
            elif now >= start_date and now <= end_date:
                new_status = 'ongoing'
            elif now < start_date:
                new_status = 'upcoming'
            else:
                new_status = 'completed'

            # Update if status changed
            if hackathon.get('status') != new_status:
                logger.info(f"📊 Status update: {hackathon['title']} -> {new_status}")
                return new_status

        except (ValueError, KeyError) as e:
            logger.warning(f"⚠️ Could not update status for {hackathon.get('title', 'Unknown')}: {e}")

        return hackathon.get('status', 'upcoming')

    def sync_scraped_hackathons(self):
        """Main sync function"""
        logger.info("🚀 Starting hackathon sync process...")

        # Load scraped data
        scraped_data = self.load_scraped_data()
        if not scraped_data:
            return

        # Filter out expired hackathons
        active_hackathons = self.filter_expired_hackathons(scraped_data)

        # Stats tracking
        stats = {
            'new_hackathons': 0,
            'updated_hackathons': 0,
            'duplicates_skipped': 0,
            'status_updates': 0
        }

        # Process each hackathon
        for hackathon in active_hackathons:
            title = hackathon.get('title', '').strip()
            location = hackathon.get('location', {})

            if not title:
                logger.warning("⚠️ Skipping hackathon with no title")
                continue

            # Check for duplicates
            existing = self.find_duplicate_hackathon(title, location)

            if existing:
                # Update existing hackathon
                updates = {}

                # Update status
                new_status = self.update_hackathon_status(existing)
                if new_status and new_status != existing.get('status'):
                    updates['status'] = new_status
                    stats['status_updates'] += 1

                # Update other fields if they changed
                fields_to_check = ['prize', 'registrationDeadline', 'url', 'organizer']
                for field in fields_to_check:
                    if field in hackathon and hackathon[field] != existing.get(field):
                        updates[field] = hackathon[field]

                if updates:
                    updates['updatedAt'] = datetime.now()
                    self.hackathons_collection.update_one(
                        {'_id': existing['_id']},
                        {'$set': updates}
                    )
                    stats['updated_hackathons'] += 1
                    logger.info(f"🔄 Updated: {title}")
                else:
                    stats['duplicates_skipped'] += 1
                    logger.debug(f"⏭️ Skipped duplicate: {title}")

            else:
                # Add new hackathon
                # Prepare document for MongoDB
                mongo_doc = {
                    'title': title,
                    'description': hackathon.get('description', ''),
                    'organizer': hackathon.get('organizer', 'Unstop'),
                    'category': hackathon.get('category', 'Technology'),
                    'difficulty': hackathon.get('difficulty', 'Intermediate'),
                    'startDate': datetime.strptime(hackathon['startDate'], '%Y-%m-%d'),
                    'endDate': datetime.strptime(hackathon['endDate'], '%Y-%m-%d'),
                    'registrationDeadline': datetime.strptime(hackathon.get('registrationDeadline', hackathon['startDate']), '%Y-%m-%d'),
                    'location': {
                        'type': hackathon.get('location', {}).get('type', 'online'),
                        'venue': hackathon.get('location', {}).get('venue', 'Online'),
                        'address': hackathon.get('location', {}).get('address', {})
                    },
                    'prizes': [{
                        'position': '1st',
                        'amount': self.parse_prize_amount(hackathon.get('prize', '0')),
                        'currency': 'INR'
                    }] if hackathon.get('prize') else [],
                    'maxParticipants': 100,  # Default
                    'currentParticipants': 0,
                    'teamSize': hackathon.get('teamSize', {'min': 1, 'max': 4}),
                    'technologies': [],
                    'requirements': [],
                    'tags': [hackathon.get('category', 'Technology').lower()],
                    'status': hackathon.get('status', 'upcoming'),
                    'featured': hackathon.get('featured', False),
                    'verified': False,
                    'links': {
                        'website': hackathon.get('url', ''),
                        'registration': hackathon.get('url', '')
                    },
                    'contactInfo': {},
                    'schedule': [],
                    'faqs': [],
                    'source': 'scraped',
                    'scrapedAt': datetime.strptime(hackathon['scraped_at'], '%Y-%m-%d %H:%M:%S'),
                    'createdAt': datetime.now(),
                    'updatedAt': datetime.now()
                }

                # Insert new hackathon
                result = self.hackathons_collection.insert_one(mongo_doc)
                stats['new_hackathons'] += 1
                logger.info(f"➕ Added new: {title}")

        # Update status for all existing hackathons
        self.update_all_hackathon_statuses()

        # Clean up old trashed items
        self.cleanup_old_trash()

        # Print summary
        self.print_sync_summary(stats)

    def update_all_hackathon_statuses(self):
        """Update status for all existing hackathons based on current dates"""
        logger.info("📊 Updating status for all existing hackathons...")

        now = datetime.now()
        updates_count = 0

        # Find all non-trashed hackathons
        hackathons = list(self.hackathons_collection.find({'status': {'$ne': 'trashed'}}))

        for hackathon in hackathons:
            try:
                start_date = hackathon['startDate']
                end_date = hackathon['endDate']
                reg_deadline = hackathon.get('registrationDeadline', start_date)

                # Determine correct status
                if now > reg_deadline:
                    new_status = 'registration_closed'
                elif now >= start_date and now <= end_date:
                    new_status = 'ongoing'
                elif now < start_date:
                    new_status = 'upcoming'
                else:
                    new_status = 'completed'

                # Update if status changed
                if hackathon.get('status') != new_status:
                    self.hackathons_collection.update_one(
                        {'_id': hackathon['_id']},
                        {'$set': {'status': new_status, 'updatedAt': now}}
                    )
                    updates_count += 1

            except (KeyError, TypeError) as e:
                logger.warning(f"⚠️ Could not update status for {hackathon.get('title', 'Unknown')}: {e}")

        logger.info(f"📊 Updated status for {updates_count} hackathons")

    def parse_prize_amount(self, prize_str):
        """Parse prize amount from string"""
        try:
            import re
            # Extract numbers from prize string
            match = re.search(r'₹?([\d,]+)', str(prize_str))
            if match:
                return int(match.group(1).replace(',', ''))
            return 0
        except:
            return 0

    def move_to_trash(self, hackathon_id):
        """Move hackathon to trash collection"""
        try:
            # Find the hackathon
            hackathon = self.hackathons_collection.find_one({'_id': hackathon_id})
            if not hackathon:
                return False

            # Add to trash with deletion timestamp
            trash_doc = {
                **hackathon,
                'deletedAt': datetime.now(),
                'autoDeleteAfter': datetime.now() + timedelta(days=7)  # Delete after 7 days
            }

            # Insert to trash
            self.trash_collection.insert_one(trash_doc)

            # Remove from main collection
            self.hackathons_collection.delete_one({'_id': hackathon_id})

            logger.info(f"🗑️ Moved to trash: {hackathon.get('title', 'Unknown')}")
            return True

        except Exception as e:
            logger.error(f"❌ Error moving to trash: {e}")
            return False

    def cleanup_old_trash(self):
        """Remove items from trash that are older than 7 days"""
        cutoff_date = datetime.now() - timedelta(days=7)

        result = self.trash_collection.delete_many({
            'autoDeleteAfter': {'$lt': datetime.now()}
        })

        if result.deleted_count > 0:
            logger.info(f"🧹 Cleaned up {result.deleted_count} old trashed items")

    def print_sync_summary(self, stats):
        """Print sync operation summary"""
        print("\n" + "="*60)
        print("🎉 HACKATHON SYNC COMPLETED")
        print("="*60)
        print(f"➕ New hackathons added: {stats['new_hackathons']}")
        print(f"🔄 Existing hackathons updated: {stats['updated_hackathons']}")
        print(f"⏭️ Duplicates skipped: {stats['duplicates_skipped']}")
        print(f"📊 Status updates: {stats['status_updates']}")
        print("="*60)

        # Show current database stats
        total_hackathons = self.hackathons_collection.count_documents({'status': {'$ne': 'trashed'}})
        status_breakdown = {}
        for doc in self.hackathons_collection.aggregate([
            {'$match': {'status': {'$ne': 'trashed'}}},
            {'$group': {'_id': '$status', 'count': {'$sum': 1}}}
        ]):
            status_breakdown[doc['_id']] = doc['count']

        print(f"📊 Current database: {total_hackathons} total hackathons")
        for status, count in status_breakdown.items():
            print(f"   {status}: {count}")
        print("="*60)

def main():
    """Main function"""
    try:
        sync_manager = HackathonSyncManager()
        sync_manager.sync_scraped_hackathons()
        print("\n✅ Sync completed successfully!")
    except KeyboardInterrupt:
        print("\n⚠️ Sync interrupted by user")
    except Exception as e:
        logger.error(f"❌ Sync failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    import re  # For regex in duplicate checking
    main()
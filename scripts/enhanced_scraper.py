from playwright.sync_api import sync_playwright
import json
import time
import os
import re
from datetime import datetime, timedelta

# Target URL for hackathons
TARGET_URL = 'https://unstop.com/hackathons?oppstatus=open&domain=2&course=6&specialization=Information%20Technology&usertype=students&passingOutYear=2027'

def extract_date_from_text(text):
    """Extract date from text containing 'days left' or similar patterns"""
    try:
        # Look for patterns like "11 days left", "23 days left", etc.
        days_match = re.search(r'(\d+)\s*days?\s*left', text, re.IGNORECASE)
        if days_match:
            days_left = int(days_match.group(1))
            deadline_date = datetime.now() + timedelta(days=days_left)
            return deadline_date.strftime('%Y-%m-%d')
        return None
    except:
        return None

def extract_prize_from_text(text):
    """Extract prize amount from text"""
    try:
        # Look for ₹ symbol followed by numbers
        prize_match = re.search(r'₹([\d,]+)', text)
        if prize_match:
            return f"₹{prize_match.group(1)}"
        return None
    except:
        return None

def extract_location_from_text(text):
    """Extract location/organizer from text"""
    try:
        # Common patterns for Indian institutions
        location_patterns = [
            r'([A-Za-z\s]+(?:University|Institute|College|IIT|NIT|IIIT)[A-Za-z\s,]*)',
            r'([A-Za-z\s]+,\s*[A-Za-z\s]+)',  # City, State pattern
        ]

        for pattern in location_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                location = match.group(1).strip()
                # Clean up common artifacts
                location = re.sub(r'\s+', ' ', location)
                return location

        return None
    except:
        return None

def determine_hackathon_status(deadline_date, start_date=None):
    """Determine hackathon status based on dates"""
    now = datetime.now()

    if deadline_date:
        deadline = datetime.strptime(deadline_date, '%Y-%m-%d')
        if now > deadline:
            return 'registration_closed'
        elif start_date:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            if now >= start:
                return 'ongoing'
            else:
                return 'upcoming'
        else:
            return 'upcoming'
    return 'upcoming'

def scrape_hackathons():
    """
    Scrape hackathon data from Unstop with improved parsing
    """
    hackathon_data = []

    print("Starting improved hackathon scraper...")

    try:
        with sync_playwright() as p:
            # Launch browser
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            print(f"Navigating to Unstop...")
            page.goto(TARGET_URL, wait_until="domcontentloaded")

            # Wait for page to load
            time.sleep(3)

            # Try to find hackathon cards
            card_selectors = [
                'div.single_profile',
                '.hackathon-card',
                '.competition-card',
                '[data-testid="hackathon-card"]',
                '.card'
            ]

            cards_found = False
            cards = None

            for selector in card_selectors:
                try:
                    page.wait_for_selector(selector, timeout=5000)
                    cards = page.locator(selector)
                    count = cards.count()
                    if count > 0:
                        print(f"Found {count} cards using selector: {selector}")
                        cards_found = True
                        break
                except:
                    continue

            if not cards_found:
                print("⚠️ No cards found with standard selectors, trying alternative approach...")
                cards = page.locator('div:has(h3), div:has(h4), .card, [class*="hack"], [class*="competition"]')
                count = cards.count()
                print(f"Found {count} potential cards with fallback selector")

            if count == 0:
                print("No hackathon cards found on the page")
                browser.close()
                return []

            # Process all cards (not limited to 8)
            print(f"Processing {count} hackathon cards...")

            for i in range(count):
                try:
                    card = cards.nth(i)

                    # Extract title from h2 element
                    title = "Unknown Hackathon"
                    try:
                        title_elem = card.locator('h2').first
                        if title_elem.is_visible():
                            title_text = title_elem.text_content().strip()
                            if title_text and len(title_text) > 3:
                                title = title_text
                    except:
                        # Fallback to other selectors
                        title_selectors = ['h3', 'h4', '.title', '.card-title']
                        for title_sel in title_selectors:
                            try:
                                title_elem = card.locator(title_sel).first
                                if title_elem.is_visible():
                                    title_text = title_elem.text_content().strip()
                                    if title_text and len(title_text) > 3:
                                        title = title_text
                                        break
                            except:
                                continue

                    # Extract link
                    link = "N/A"
                    try:
                        link_elem = card.locator('a').first
                        href = link_elem.get_attribute('href')
                        if href:
                            link = f'https://unstop.com{href}' if href.startswith('/') else href
                    except:
                        pass

                    # Get full card text for parsing
                    card_text = ""
                    try:
                        card_text = card.text_content()
                    except:
                        pass

                    # Parse different fields from card text
                    prize = extract_prize_from_text(card_text)
                    deadline_date = extract_date_from_text(card_text)
                    location = extract_location_from_text(card_text)

                    # Determine status
                    status = determine_hackathon_status(deadline_date)

                    # Extract organizer (usually the institution name)
                    organizer = location if location else "Unstop"

                    # Create proper dates
                    start_date = None
                    end_date = None
                    if deadline_date:
                        # Assume hackathon starts 7 days after registration closes
                        deadline_dt = datetime.strptime(deadline_date, '%Y-%m-%d')
                        start_date = (deadline_dt + timedelta(days=7)).strftime('%Y-%m-%d')
                        end_date = (deadline_dt + timedelta(days=14)).strftime('%Y-%m-%d')

                    hackathon_info = {
                        "id": i + 1,
                        "title": title,
                        "description": f"Hackathon organized by {organizer}. {title} - Exciting opportunity for developers and innovators.",
                        "startDate": start_date or "2024-12-01",  # Fallback date
                        "endDate": end_date or "2024-12-15",
                        "registrationDeadline": deadline_date or "2024-11-30",
                        "location": {
                            "type": "online",  # Most Unstop hackathons are online
                            "venue": location or "Online",
                            "address": {
                                "city": location or "Online",
                                "country": "India"
                            }
                        },
                        "organizer": organizer,
                        "prize": prize or "To be announced",
                        "url": link,
                        "status": status,
                        "category": "Technology",
                        "difficulty": "Intermediate",
                        "teamSize": {
                            "min": 1,
                            "max": 4
                        },
                        "source": "Unstop",
                        "scraped_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "featured": False,
                        "isRegistrationOpen": status == 'upcoming',
                        "raw_text": card_text[:200]  # Keep some raw text for debugging
                    }

                    hackathon_data.append(hackathon_info)
                    print(f"{i+1}. {title[:50]}... | Status: {status} | Prize: {prize}")

                    # Small delay between cards
                    time.sleep(0.5)

                except Exception as e:
                    print(f"Error processing card {i+1}: {str(e)}")
                    continue

            browser.close()

        print(f"Successfully scraped {len(hackathon_data)} hackathons!")
        return hackathon_data

    except Exception as e:
        print(f"Fatal error during scraping: {str(e)}")
        return []

def save_hackathons(data):
    """Save hackathon data to JSON file"""
    try:
        os.makedirs('data', exist_ok=True)

        # Save detailed data
        with open('data/hackathons_dynamic.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"Data saved to data/hackathons_dynamic.json ({len(data)} items)")

    except Exception as e:
        print(f"❌ Error saving data: {e}")

def display_summary(data):
    """Display a summary of scraped data"""
    if not data:
        print("❌ No data to display")
        return

    print(f"\nHACKATHON SUMMARY ({len(data)} items)")
    print("="*80)

    status_counts = {}
    for item in data:
        status = item.get('status', 'unknown')
        status_counts[status] = status_counts.get(status, 0) + 1

    print(f"Status breakdown: {status_counts}")

    print("\nSAMPLE HACKATHONS:")
    for item in data[:3]:  # Show first 3 items
        print(f"• {item['title']}")
        print(f"  Registration Deadline: {item.get('registrationDeadline', 'N/A')}")
        print(f"  Prize: {item.get('prize', 'N/A')}")
        print(f"  Location: {item['location'].get('venue', 'N/A')}")
        print(f"  Status: {item.get('status', 'N/A')}")
        print()

    if len(data) > 3:
        print(f"   ... and {len(data) - 3} more hackathons")

if __name__ == "__main__":
    # Run the scraper
    hackathons = scrape_hackathons()

    if hackathons:
        # Save data to files
        save_hackathons(hackathons)

        # Display summary
        display_summary(hackathons)

        print(f"Scraper completed successfully!")
        print(f"Check the 'data/' folder for JSON files")
    else:
        print("\n❌ No hackathons were scraped. Check your internet connection and try again.")
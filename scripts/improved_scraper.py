from playwright.sync_api import sync_playwright
import json
import time
import os

# Target URL for hackathons
TARGET_URL = 'https://unstop.com/hackathons?oppstatus=open&domain=2&course=6&specialization=Information%20Technology&usertype=students&passingOutYear=2027'

def scrape_hackathons():
    """
    Scrape hackathon data from Unstop with improved error handling
    """
    hackathon_data = []
    
    print("🚀 Starting hackathon scraper...")
    
    try:
        with sync_playwright() as p:
            # Launch browser
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            print(f"📡 Navigating to Unstop...")
            page.goto(TARGET_URL, wait_until="domcontentloaded")
            
            # Wait for page to load
            time.sleep(3)
            
            # Try to find hackathon cards with multiple selectors
            card_selectors = [
                'div.single_profile',
                '.hackathon-card',
                '.competition-card',
                '[data-testid="hackathon-card"]',
                '.card'
            ]
            
            cards_found = False
            for selector in card_selectors:
                try:
                    page.wait_for_selector(selector, timeout=5000)
                    cards = page.locator(selector)
                    count = cards.count()
                    if count > 0:
                        print(f"✅ Found {count} cards using selector: {selector}")
                        cards_found = True
                        break
                except:
                    continue
            
            if not cards_found:
                print("⚠️ No cards found with standard selectors, trying alternative approach...")
                # Try to get any links or divs that might be hackathon cards
                cards = page.locator('div:has(h3), div:has(h4), .card, [class*="hack"], [class*="competition"]')
                count = cards.count()
                print(f"Found {count} potential cards with fallback selector")
            
            if count == 0:
                print("❌ No hackathon cards found on the page")
                browser.close()
                return []
            
            # Limit to first 8 cards for demo
            limit = min(8, count)
            print(f"📊 Processing {limit} hackathon cards...")
            
            for i in range(limit):
                try:
                    card = cards.nth(i)
                    
                    # Extract title from h2 element (based on your feedback)
                    title = "Unknown Hackathon"
                    try:
                        # First try h2 in the card (as you mentioned)
                        title_elem = card.locator('h2').first
                        if title_elem.is_visible():
                            title_text = title_elem.text_content().strip()
                            if title_text and len(title_text) > 3:
                                title = title_text
                        else:
                            # Fallback to other selectors
                            title_selectors = ['h3', 'h4', '.title', '.card-title', 'a[href*="/competition/"]', 'strong']
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
                    except Exception as e:
                        print(f"Error extracting title from card {i+1}: {e}")
                    
                    # Extract link
                    link = "N/A"
                    try:
                        link_elem = card.locator('a').first
                        href = link_elem.get_attribute('href')
                        if href:
                            link = f'https://unstop.com{href}' if href.startswith('/') else href
                    except:
                        pass
                    
                    # Extract additional info from the same card container
                    prize = "N/A"
                    deadline = "N/A"
                    location = "N/A"
                    organizer = "N/A"
                    
                    # Since title, location, deadline are in same class, extract from card content
                    try:
                        # Get all text content from the card
                        card_text = card.text_content()
                        
                        # Look for prize information (₹ symbol)
                        if "₹" in card_text:
                            # Find text around ₹ symbol
                            lines = card_text.split('\n')
                            for line in lines:
                                if "₹" in line:
                                    prize = line.strip()
                                    break
                        
                        # Look for deadline (days left pattern)
                        for line in card_text.split('\n'):
                            line = line.strip()
                            if "days left" in line.lower() or "day left" in line.lower():
                                deadline = line
                                break
                            elif "deadline" in line.lower():
                                deadline = line
                                break
                        
                        # Look for location/organizer (usually contains university, institute, or city names)
                        for line in card_text.split('\n'):
                            line = line.strip()
                            if any(word in line.lower() for word in ['university', 'institute', 'iit', 'nit', 'college', 'mumbai', 'delhi', 'bangalore', 'chennai', 'pune']):
                                location = line
                                break
                        
                        # Try to find organizer info
                        for line in card_text.split('\n'):
                            line = line.strip()
                            if len(line) > 10 and len(line) < 100 and not any(x in line.lower() for x in ['days left', '₹', 'registered', 'impressions']):
                                if location == "N/A" or line != location:
                                    organizer = line
                                    break
                                    
                    except Exception as e:
                        print(f"Error extracting additional info from card {i+1}: {e}")
                        pass
                    
                    hackathon_info = {
                        "id": i + 1,
                        "title": title,
                        "description": f"{organizer} - {title}" if organizer != "N/A" else f"Hackathon opportunity: {title}",
                        "startDate": "2024-11-01",  # Placeholder dates
                        "endDate": "2024-11-30", 
                        "location": location if location != "N/A" else "Online/Hybrid",
                        "organizer": organizer,
                        "prize": prize,
                        "deadline": deadline,
                        "url": link,
                        "status": "Open",
                        "category": "Technology", 
                        "difficulty": "Intermediate",
                        "teamSize": "1-4 members",
                        "source": "Unstop",
                        "scraped_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                        "featured": False,
                        "registrationOpen": True
                    }
                    
                    hackathon_data.append(hackathon_info)
                    print(f"✅ {i+1}. {title[:60]}...")
                    
                    # Small delay between cards
                    time.sleep(0.5)
                    
                except Exception as e:
                    print(f"⚠️ Error processing card {i+1}: {str(e)}")
                    continue
            
            browser.close()
            
        print(f"\n🎉 Successfully scraped {len(hackathon_data)} hackathons!")
        return hackathon_data
        
    except Exception as e:
        print(f"❌ Fatal error during scraping: {str(e)}")
        return []

def save_hackathons(data):
    """Save hackathon data to JSON file"""
    try:
        os.makedirs('data', exist_ok=True)
        
        # Save detailed data
        with open('data/hackathons_dynamic.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        # Also create a simplified version for quick API use
        simplified_data = []
        for item in data:
            simplified_data.append({
                "id": item["id"],
                "title": item["title"],
                "description": item["description"],
                "startDate": item["startDate"],
                "endDate": item["endDate"],
                "location": item["location"],
                "url": item["url"],
                "status": item["status"]
            })
        
        with open('data/hackathons_simple.json', 'w', encoding='utf-8') as f:
            json.dump(simplified_data, f, ensure_ascii=False, indent=2)
            
        print(f"💾 Data saved to:")
        print(f"   - data/hackathons_dynamic.json ({len(data)} items)")
        print(f"   - data/hackathons_simple.json (simplified)")
        
    except Exception as e:
        print(f"❌ Error saving data: {e}")

def display_summary(data):
    """Display a summary of scraped data"""
    if not data:
        print("❌ No data to display")
        return
    
    print(f"\n📋 HACKATHON SUMMARY ({len(data)} items)")
    print("="*60)
    
    for item in data[:3]:  # Show first 3 items
        print(f"🏆 {item['title']}")
        print(f"   💰 Prize: {item['prize']}")
        print(f"   ⏰ Deadline: {item['deadline']}")
        print(f"   🔗 Link: {item['url'][:50]}...")
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
        
        print(f"\n✅ Scraper completed successfully!")
        print(f"📁 Check the 'data/' folder for JSON files")
    else:
        print("\n❌ No hackathons were scraped. Check your internet connection and try again.")
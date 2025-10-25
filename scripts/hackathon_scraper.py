from playwright.sync_api import sync_playwright
import json
import time

# --- SETUP INSTRUCTIONS (REQUIRED FOR PLAYWRIGHT) ---
# 1. Install Python: pip install playwright beautifulsoup4
# 2. Install browser drivers: playwright install

# --- CONFIGURATION SECTION: SELECTORS FOR DYNAMIC SCRAPING ---

# 1. Target URL
TARGET_URL = 'https://unstop.com/hackathons?oppstatus=open&domain=2&course=6&specialization=Information%20Technology&usertype=students&passingOutYear=2027'

# 2. Left List Selectors (Used to find and click the cards)
# This selector targets all clickable hackathon cards in the left column.
CLICKABLE_CARD_SELECTOR = 'div.single_profile'
# The selector for the title element within the card (for tracking/logging)
TITLE_SELECTOR_LEFT = 'a.link-dark'

# 3. Right Detail Pane Selectors (Used after a click)

import pandas as pd
import re
from datetime import datetime

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
from bs4 import BeautifulSoup

import gspread
from gspread_dataframe import set_with_dataframe
import time

# === CONFIGURATION ===
SERVICE_ACCOUNT_FILE = 'service_account.json'
SHEET_NAME = "Real Estate Listings"

# ---- AUTO-CREATE SHEET OR USE EXISTING ----
print("Authenticating with Google Drive...")
gc = gspread.service_account(filename=SERVICE_ACCOUNT_FILE)

# Try to open existing sheet, or create it if it doesn't exist
try:
    sh = gc.open(SHEET_NAME)
    print(f"✓ Using existing sheet: {SHEET_NAME}")
except gspread.exceptions.SpreadsheetNotFound:
    print(f"Creating new sheet: {SHEET_NAME}")
    try:
        sh = gc.create(SHEET_NAME)
        print(f"✓ Sheet created successfully!")
        time.sleep(2)  # Wait for sheet to be created
    except Exception as e:
        print(f"Error creating sheet: {e}")
        print("\nAlternative: Create a sheet manually in Google Drive and paste the URL below")
        url = input("Enter your Google Sheet URL: ")
        sh = gc.open_by_url(url)

SPREADSHEET_URL = sh.url
print(f"Sheet URL: {SPREADSHEET_URL}\n")

# ---- SCRAPE THE WEBPAGE ----
URL = "https://www.truesouthcoastalhomes.com/property-search/market-update/update/?searchtype=2&searchid=6900559#"

options = Options()
options.add_argument("--headless")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)

print("Scraping webpage...")
driver.get(URL)
WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.TAG_NAME, "table")))
soup = BeautifulSoup(driver.page_source, "html.parser")
driver.quit()

listings = []
for row in soup.find_all("tr")[1:]:
    cols = row.find_all("td")
    if len(cols) < 7 or "Avg." in cols[0].get_text():
        continue
    address = " ".join(cols[0].get_text(strip=True).split())
    link_tag = cols[0].find("a")
    link = "https://www.truesouthcoastalhomes.com" + link_tag["href"] if link_tag else ""
    price = "$" + re.sub(r"[^\d]", "", cols[4].get_text(strip=True))
    mls = re.search(r"mls.?(\d+)", link, re.I)
    mls = mls.group(1) if mls else ""
    listings.append({
        "Address": address,
        "Price": price,
        "Beds": cols[1].get_text(strip=True),
        "Baths": cols[2].get_text(strip=True),
        "Sq Ft": cols[3].get_text(strip=True).replace(",", ""),
        "Days on Market": cols[6].get_text(strip=True).split()[0],
        "MLS #": mls,
        "Link": link,
        "Updated": datetime.now().strftime("%Y-%m-%d %H:%M")
    })

df = pd.DataFrame(listings)
print(f"✓ Scraped {len(df)} listings\n")

# ---- WRITE TO GOOGLE SHEETS ----
print("Updating Google Sheet...")
ws = sh.sheet1
ws.clear()
set_with_dataframe(ws, df)

print(f"\n✅ SUCCESS! Your Google Sheet is ready with {len(df)} listings")
print(f"📊 Sheet URL: {SPREADSHEET_URL}")

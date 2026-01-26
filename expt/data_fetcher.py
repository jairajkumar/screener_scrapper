import requests
import re
import time
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from config import SCREENER_BASE_URL, SCREENER_SEARCH_URL, USER_AGENT

class StockDataFetcher:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': USER_AGENT})
        self.driver = None
        
    def setup_driver(self):
        """Setup Chrome driver for dynamic content"""
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument(f"--user-agent={USER_AGENT}")
        
        # Debug: print the chromedriver path
        chromedriver_path = ChromeDriverManager().install()
        print(f"[DEBUG] ChromeDriverManager().install() returned: {chromedriver_path}")
        # Use the correct binary path explicitly
        chromedriver_path = "/home/jairaj/.wdm/drivers/chromedriver/linux64/133.0.6943.141/chromedriver-linux64/chromedriver"
        print(f"[DEBUG] Using chromedriver binary: {chromedriver_path}")
        service = Service(chromedriver_path)
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        
    def search_stock(self, stock_name):
        """Search for stock and get the first result"""
        try:
            # First try with requests
            search_url = f"{SCREENER_SEARCH_URL}?q={stock_name}"
            response = self.session.get(search_url)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Look for stock links in search results
                stock_links = soup.find_all('a', href=re.compile(r'/company/'))
                
                if stock_links:
                    stock_url = SCREENER_BASE_URL + stock_links[0]['href']
                    return stock_url
                    
            # If requests fail, use Selenium
            if not self.driver:
                self.setup_driver()
                
            self.driver.get(search_url)
            time.sleep(2)
            
            # Wait for search results
            wait = WebDriverWait(self.driver, 10)
            stock_link = wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "a[href*='/company/']"))
            )
            
            stock_url = stock_link.get_attribute('href')
            return stock_url
            
        except Exception as e:
            print(f"Error searching for stock {stock_name}: {e}")
            return None
    
    def extract_financial_data(self, stock_url):
        """Extract financial data from stock page"""
        try:
            if not self.driver:
                self.setup_driver()
                
            self.driver.get(stock_url)
            time.sleep(3)
            
            # Wait for page to load
            wait = WebDriverWait(self.driver, 15)
            
            # Extract key metrics
            data = {}
            
            # ROE
            try:
                roe_element = wait.until(
                    EC.presence_of_element_located((By.XPATH, "//td[contains(text(), 'ROE')]/following-sibling::td"))
                )
                data['roe'] = self._extract_number(roe_element.text)
            except:
                data['roe'] = None
                
            # P/E Ratio
            try:
                pe_element = wait.until(
                    EC.presence_of_element_located((By.XPATH, "//td[contains(text(), 'P/E')]/following-sibling::td"))
                )
                data['pe_ratio'] = self._extract_number(pe_element.text)
            except:
                data['pe_ratio'] = None
                
            # Debt to Equity
            try:
                debt_equity_element = wait.until(
                    EC.presence_of_element_located((By.XPATH, "//td[contains(text(), 'Debt to equity')]/following-sibling::td"))
                )
                data['debt_to_equity'] = self._extract_number(debt_equity_element.text)
            except:
                data['debt_to_equity'] = None
                
            # ROCE
            try:
                roce_element = wait.until(
                    EC.presence_of_element_located((By.XPATH, "//td[contains(text(), 'ROCE')]/following-sibling::td"))
                )
                data['roce'] = self._extract_number(roce_element.text)
            except:
                data['roce'] = None
                
            # EPS Growth
            try:
                eps_growth_element = wait.until(
                    EC.presence_of_element_located((By.XPATH, "//td[contains(text(), 'EPS Growth')]/following-sibling::td"))
                )
                data['eps_growth'] = self._extract_number(eps_growth_element.text)
            except:
                data['eps_growth'] = None
                
            # PEG Ratio
            try:
                peg_element = wait.until(
                    EC.presence_of_element_located((By.XPATH, "//td[contains(text(), 'PEG')]/following-sibling::td"))
                )
                data['peg'] = self._extract_number(peg_element.text)
            except:
                data['peg'] = None
                
            # EPS
            try:
                eps_element = wait.until(
                    EC.presence_of_element_located((By.XPATH, "//td[contains(text(), 'EPS')]/following-sibling::td"))
                )
                data['eps'] = self._extract_number(eps_element.text)
            except:
                data['eps'] = None
                
            # Book Value
            try:
                bv_element = wait.until(
                    EC.presence_of_element_located((By.XPATH, "//td[contains(text(), 'Book Value')]/following-sibling::td"))
                )
                data['book_value'] = self._extract_number(bv_element.text)
            except:
                data['book_value'] = None
                
            # Cash Flow (simplified check)
            try:
                cf_element = wait.until(
                    EC.presence_of_element_located((By.XPATH, "//td[contains(text(), 'Cash Flow')]/following-sibling::td"))
                )
                data['cash_flow'] = self._extract_number(cf_element.text)
            except:
                data['cash_flow'] = None
                
            return data
            
        except Exception as e:
            print(f"Error extracting data: {e}")
            return {}
    
    def _extract_number(self, text):
        """Extract numeric value from text"""
        if not text:
            return None
            
        # Remove common suffixes and extract number
        text = text.replace(',', '').replace('%', '').strip()
        
        # Handle negative numbers
        if text.startswith('-'):
            multiplier = -1
            text = text[1:]
        else:
            multiplier = 1
            
        # Extract numeric part
        match = re.search(r'[\d.]+', text)
        if match:
            try:
                return float(match.group()) * multiplier
            except:
                return None
        return None
    
    def get_stock_data(self, stock_name):
        """Main method to get stock data"""
        print(f"Searching for stock: {stock_name}")
        
        # Search for stock
        stock_url = self.search_stock(stock_name)
        if not stock_url:
            return None
            
        print(f"Found stock URL: {stock_url}")
        
        # Extract financial data
        data = self.extract_financial_data(stock_url)
        
        return {
            'stock_name': stock_name,
            'url': stock_url,
            'financial_data': data
        }
    
    def close(self):
        """Close the driver"""
        if self.driver:
            self.driver.quit() 
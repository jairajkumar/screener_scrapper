#!/usr/bin/env python3
"""
Test script for Stock Analysis Tool
"""

def test_imports():
    """Test if all modules can be imported"""
    try:
        from data_fetcher import StockDataFetcher
        from stock_analyzer import StockAnalyzer
        from ai_advisor import AIAdvisor
        from config import STOCK_CRITERIA
        print("✅ All imports successful")
        return True
    except Exception as e:
        print(f"❌ Import error: {e}")
        return False

def test_analyzer():
    """Test the stock analyzer with sample data"""
    try:
        from stock_analyzer import StockAnalyzer
        
        # Sample financial data
        sample_data = {
            'roe': 20.5,
            'pe_ratio': 15.2,
            'debt_to_equity': 0.3,
            'roce': 18.7,
            'cash_flow': 5000,
            'eps_growth': 12.5,
            'peg': 0.8,
            'eps': 45.2,
            'book_value': 125.5
        }
        
        analyzer = StockAnalyzer()
        result = analyzer.analyze_stock(sample_data)
        
        print(f"✅ Analyzer test successful")
        print(f"   Verdict: {result['verdict']}")
        print(f"   Score: {result['score']}/{result['total_criteria']}")
        return True
        
    except Exception as e:
        print(f"❌ Analyzer test failed: {e}")
        return False

def test_ai_advisor():
    """Test AI advisor initialization"""
    try:
        from ai_advisor import AIAdvisor
        
        advisor = AIAdvisor()
        if advisor.model:
            print("✅ AI Advisor initialized with API key")
        else:
            print("⚠️ AI Advisor initialized without API key (normal)")
        return True
        
    except Exception as e:
        print(f"❌ AI Advisor test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Stock Analysis Tool Components")
    print("=" * 50)
    
    tests = [
        test_imports,
        test_analyzer,
        test_ai_advisor
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The tool is ready to use.")
    else:
        print("⚠️ Some tests failed. Please check the errors above.")

if __name__ == "__main__":
    main() 
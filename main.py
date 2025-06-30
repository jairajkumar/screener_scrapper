#!/usr/bin/env python3
"""
Stock Analysis Tool
Analyzes Indian stocks based on investment criteria and provides AI-powered insights
"""

import sys
import time
from data_fetcher import StockDataFetcher
from stock_analyzer import StockAnalyzer
from ai_advisor import AIAdvisor

def print_banner():
    """Print application banner"""
    print("=" * 60)
    print("           📈 STOCK ANALYSIS TOOL 📈")
    print("=" * 60)
    print("Analyzing stocks based on investment criteria:")
    print("• ROE > 15%")
    print("• P/E Ratio < 20")
    print("• Debt-to-Equity < 0.5")
    print("• ROCE > 15%")
    print("• Cash Flow Positive")
    print("• EPS Growth 10-15%")
    print("• PEG < 1")
    print("• Intrinsic Value = 22.5 × EPS × BV")
    print("=" * 60)

def print_verdict(verdict, color_code):
    """Print verdict with color coding"""
    colors = {
        'BUY': '\033[92m',    # Green
        'HOLD': '\033[93m',   # Yellow
        'NA': '\033[91m',     # Red
    }
    reset = '\033[0m'
    
    color = colors.get(verdict, '')
    print(f"{color}🎯 VERDICT: {verdict}{reset}")

def analyze_stock(stock_name):
    """Main function to analyze a stock"""
    print(f"\n🔍 Analyzing {stock_name.upper()}...")
    print("Fetching data from screener.in...")
    
    # Initialize components
    fetcher = StockDataFetcher()
    analyzer = StockAnalyzer()
    ai_advisor = AIAdvisor()
    
    try:
        # Fetch stock data
        stock_data = fetcher.get_stock_data(stock_name)
        
        if not stock_data:
            print("❌ Could not find stock data. Please check the stock name.")
            return
        
        print("✅ Data fetched successfully!")
        print(f"📊 Stock URL: {stock_data['url']}")
        
        # Analyze stock
        print("\n📈 Analyzing financial metrics...")
        analysis_result = analyzer.analyze_stock(stock_data['financial_data'])
        
        # Display results
        print("\n" + "=" * 50)
        print(f"📋 ANALYSIS RESULTS FOR {stock_name.upper()}")
        print("=" * 50)
        
        # Print verdict
        print_verdict(analysis_result['verdict'], analysis_result['verdict'])
        print(f"📊 Score: {analysis_result['score']}/{analysis_result['total_criteria']} ({analysis_result['score_percentage']:.1f}%)")
        print(f"💡 Reason: {analysis_result['reason']}")
        
        # Print detailed analysis
        print("\n📊 DETAILED ANALYSIS:")
        details = analyzer.get_detailed_analysis(analysis_result)
        for detail in details:
            print(f"  {detail}")
        
        # Get AI insights
        print("\n🤖 AI INSIGHTS:")
        ai_insights = ai_advisor.get_ai_insights(
            stock_name, 
            stock_data['financial_data'], 
            analysis_result
        )
        
        print(f"💭 Insights: {ai_insights['insights']}")
        
        if ai_insights['recommendations']:
            print("\n📝 Recommendations:")
            for i, rec in enumerate(ai_insights['recommendations'], 1):
                print(f"  {i}. {rec}")
        
        if ai_insights['risk_factors']:
            print("\n⚠️ Risk Factors:")
            for i, risk in enumerate(ai_insights['risk_factors'], 1):
                print(f"  {i}. {risk}")
        
        if ai_insights['market_context']:
            print(f"\n🌍 Market Context: {ai_insights['market_context']}")
        
        # Quick AI advice
        quick_advice = ai_advisor.get_quick_advice(stock_name, analysis_result['verdict'])
        print(f"\n💡 Quick Advice: {quick_advice}")
        
        print("\n" + "=" * 50)
        
    except Exception as e:
        print(f"❌ Error analyzing stock: {str(e)}")
    
    finally:
        # Clean up
        fetcher.close()

def main():
    """Main application entry point"""
    print_banner()
    
    if len(sys.argv) > 1:
        # Stock name provided as command line argument
        stock_name = sys.argv[1]
        analyze_stock(stock_name)
    else:
        # Interactive mode
        while True:
            try:
                stock_name = input("\n📝 Enter stock name (or 'quit' to exit): ").strip()
                
                if stock_name.lower() in ['quit', 'exit', 'q']:
                    print("👋 Goodbye!")
                    break
                
                if not stock_name:
                    print("❌ Please enter a valid stock name.")
                    continue
                
                analyze_stock(stock_name)
                
                # Ask if user wants to analyze another stock
                another = input("\n🔄 Analyze another stock? (y/n): ").strip().lower()
                if another not in ['y', 'yes']:
                    print("👋 Goodbye!")
                    break
                    
            except KeyboardInterrupt:
                print("\n\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"❌ Unexpected error: {str(e)}")

if __name__ == "__main__":
    main() 
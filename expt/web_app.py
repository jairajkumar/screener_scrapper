import streamlit as st
import pandas as pd
import time
from data_fetcher import StockDataFetcher
from stock_analyzer import StockAnalyzer
from ai_advisor import AIAdvisor

def main():
    st.set_page_config(
        page_title="Stock Analysis Tool",
        page_icon="📈",
        layout="wide"
    )
    
    st.title("📈 Stock Analysis Tool")
    st.markdown("---")
    
    # Sidebar for configuration
    st.sidebar.header("⚙️ Configuration")
    
    # Stock input
    stock_name = st.sidebar.text_input(
        "Enter Stock Name",
        placeholder="e.g., TCS, Reliance, HDFC Bank"
    )
    
    # Analysis button
    analyze_button = st.sidebar.button("🔍 Analyze Stock", type="primary")
    
    # Main content area
    if analyze_button and stock_name:
        with st.spinner("🔍 Analyzing stock data..."):
            try:
                # Initialize components
                fetcher = StockDataFetcher()
                analyzer = StockAnalyzer()
                ai_advisor = AIAdvisor()
                
                # Fetch stock data
                stock_data = fetcher.get_stock_data(stock_name)
                
                if not stock_data:
                    st.error("❌ Could not find stock data. Please check the stock name.")
                    fetcher.close()
                    return
                
                # Analyze stock
                analysis_result = analyzer.analyze_stock(stock_data['financial_data'])
                
                # Display results
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    st.metric("Score", f"{analysis_result['score']}/{analysis_result['total_criteria']}")
                
                with col2:
                    st.metric("Score %", f"{analysis_result['score_percentage']:.1f}%")
                
                with col3:
                    # Color code the verdict
                    verdict = analysis_result['verdict']
                    if verdict == 'BUY':
                        st.success(f"🎯 {verdict}")
                    elif verdict == 'HOLD':
                        st.warning(f"🎯 {verdict}")
                    else:
                        st.error(f"🎯 {verdict}")
                
                # Stock URL
                st.info(f"📊 Data Source: [Screener.in]({stock_data['url']})")
                
                # Detailed analysis
                st.subheader("📊 Detailed Analysis")
                
                # Create a DataFrame for better display
                analysis_data = []
                for metric, data in analysis_result['analysis'].items():
                    status_emoji = {
                        'PASS': '✅',
                        'FAIL': '❌',
                        'CALCULATED': '📊',
                        'NA': '⚠️'
                    }
                    
                    analysis_data.append({
                        'Metric': metric.upper().replace('_', ' '),
                        'Status': f"{status_emoji.get(data['status'], '❓')} {data['status']}",
                        'Value': data['value'] if data['value'] is not None else 'N/A',
                        'Target': data['threshold'] if data['threshold'] is not None else 'N/A'
                    })
                
                df = pd.DataFrame(analysis_data)
                st.dataframe(df, use_container_width=True)
                
                # AI Insights
                st.subheader("🤖 AI Insights")
                
                with st.spinner("Getting AI insights..."):
                    ai_insights = ai_advisor.get_ai_insights(
                        stock_name,
                        stock_data['financial_data'],
                        analysis_result
                    )
                
                # Display AI insights in tabs
                tab1, tab2, tab3, tab4 = st.tabs(["💭 Insights", "📝 Recommendations", "⚠️ Risk Factors", "🌍 Market Context"])
                
                with tab1:
                    st.write(ai_insights['insights'])
                
                with tab2:
                    if ai_insights['recommendations']:
                        for i, rec in enumerate(ai_insights['recommendations'], 1):
                            st.write(f"{i}. {rec}")
                    else:
                        st.write("No specific recommendations available.")
                
                with tab3:
                    if ai_insights['risk_factors']:
                        for i, risk in enumerate(ai_insights['risk_factors'], 1):
                            st.write(f"{i}. {risk}")
                    else:
                        st.write("No specific risk factors identified.")
                
                with tab4:
                    st.write(ai_insights['market_context'])
                
                # Quick advice
                st.subheader("💡 Quick Advice")
                quick_advice = ai_advisor.get_quick_advice(stock_name, analysis_result['verdict'])
                st.info(quick_advice)
                
                # Raw financial data (collapsible)
                with st.expander("📋 Raw Financial Data"):
                    financial_df = pd.DataFrame([
                        {"Metric": k.replace('_', ' ').title(), "Value": v}
                        for k, v in stock_data['financial_data'].items()
                    ])
                    st.dataframe(financial_df, use_container_width=True)
                
                # Clean up
                fetcher.close()
                
            except Exception as e:
                st.error(f"❌ Error analyzing stock: {str(e)}")
    
    else:
        # Welcome message
        st.markdown("""
        ## Welcome to the Stock Analysis Tool! 🎯
        
        This tool analyzes Indian stocks based on the following investment criteria:
        
        ### 📊 Investment Criteria:
        - **ROE** > 15%
        - **P/E Ratio** < 20
        - **Debt-to-Equity** < 0.5
        - **ROCE** > 15%
        - **Cash Flow** Positive
        - **EPS Growth** 10-15%
        - **PEG** < 1
        - **Intrinsic Value** = 22.5 × EPS × BV
        
        ### 🚀 How to use:
        1. Enter a stock name in the sidebar
        2. Click "Analyze Stock"
        3. Get instant BUY/HOLD/NA verdict
        4. Review detailed analysis and AI insights
        
        ### 💡 Features:
        - ✅ Automated data fetching from Screener.in
        - 🤖 AI-powered insights using Gemini
        - 📊 Detailed financial analysis
        - 🎯 Clear investment recommendations
        - ⚠️ Risk factor identification
        
        **Enter a stock name to get started!**
        """)
        
        # Example stocks
        st.subheader("💡 Example Stocks to Try:")
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if st.button("TCS"):
                st.session_state.stock_name = "TCS"
                st.rerun()
        
        with col2:
            if st.button("Reliance"):
                st.session_state.stock_name = "Reliance"
                st.rerun()
        
        with col3:
            if st.button("HDFC Bank"):
                st.session_state.stock_name = "HDFC Bank"
                st.rerun()

if __name__ == "__main__":
    main() 
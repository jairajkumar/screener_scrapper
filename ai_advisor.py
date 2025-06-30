import google.generativeai as genai
from config import GEMINI_API_KEY

class AIAdvisor:
    def __init__(self):
        if GEMINI_API_KEY:
            genai.configure(api_key=GEMINI_API_KEY)
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            self.model = None
    
    def get_ai_insights(self, stock_name, financial_data, analysis_result):
        """Get AI-powered insights and recommendations"""
        if not self.model:
            return {
                'insights': 'AI advisor not available - GEMINI_API_KEY not configured',
                'recommendations': [],
                'risk_factors': [],
                'market_context': 'Unable to provide market context without AI'
            }
        
        try:
            # Prepare the prompt
            prompt = self._create_analysis_prompt(stock_name, financial_data, analysis_result)
            
            # Get AI response
            response = self.model.generate_content(prompt)
            
            # Parse the response
            return self._parse_ai_response(response.text)
            
        except Exception as e:
            return {
                'insights': f'Error getting AI insights: {str(e)}',
                'recommendations': [],
                'risk_factors': [],
                'market_context': 'Error occurred while analyzing'
            }
    
    def _create_analysis_prompt(self, stock_name, financial_data, analysis_result):
        """Create a comprehensive prompt for AI analysis"""
        
        # Format financial data
        financial_summary = "\n".join([
            f"{key.replace('_', ' ').title()}: {value}" 
            for key, value in financial_data.items() 
            if value is not None
        ])
        
        # Format analysis results
        analysis_summary = f"""
        Verdict: {analysis_result['verdict']}
        Score: {analysis_result['score']}/{analysis_result['total_criteria']} ({analysis_result['score_percentage']:.1f}%)
        Reason: {analysis_result['reason']}
        """
        
        prompt = f"""
        You are a professional stock market analyst. Analyze the following Indian stock data and provide insights:

        STOCK: {stock_name}

        FINANCIAL DATA:
        {financial_summary}

        ANALYSIS RESULTS:
        {analysis_summary}

        Please provide a comprehensive analysis in the following format:

        INSIGHTS:
        [Provide 2-3 key insights about the stock's financial health and performance]

        RECOMMENDATIONS:
        [Provide 3-4 specific recommendations for investors]

        RISK FACTORS:
        [List 3-4 potential risk factors to consider]

        MARKET CONTEXT:
        [Brief analysis of how this stock fits in the current market environment]

        Keep your response concise, professional, and actionable. Focus on practical investment advice.
        """
        
        return prompt
    
    def _parse_ai_response(self, response_text):
        """Parse the AI response into structured format"""
        try:
            sections = response_text.split('\n\n')
            
            insights = []
            recommendations = []
            risk_factors = []
            market_context = ""
            
            current_section = None
            
            for section in sections:
                section = section.strip()
                if not section:
                    continue
                    
                if section.startswith('INSIGHTS:'):
                    current_section = 'insights'
                    content = section.replace('INSIGHTS:', '').strip()
                    if content:
                        insights.append(content)
                elif section.startswith('RECOMMENDATIONS:'):
                    current_section = 'recommendations'
                    content = section.replace('RECOMMENDATIONS:', '').strip()
                    if content:
                        recommendations.append(content)
                elif section.startswith('RISK FACTORS:'):
                    current_section = 'risk_factors'
                    content = section.replace('RISK FACTORS:', '').strip()
                    if content:
                        risk_factors.append(content)
                elif section.startswith('MARKET CONTEXT:'):
                    current_section = 'market_context'
                    content = section.replace('MARKET CONTEXT:', '').strip()
                    if content:
                        market_context = content
                elif current_section:
                    # Continue adding to current section
                    if current_section == 'insights':
                        insights.append(section)
                    elif current_section == 'recommendations':
                        recommendations.append(section)
                    elif current_section == 'risk_factors':
                        risk_factors.append(section)
                    elif current_section == 'market_context':
                        market_context += " " + section
            
            return {
                'insights': '\n'.join(insights) if insights else 'No specific insights available',
                'recommendations': recommendations,
                'risk_factors': risk_factors,
                'market_context': market_context if market_context else 'Market context not available'
            }
            
        except Exception as e:
            return {
                'insights': f'Error parsing AI response: {str(e)}',
                'recommendations': [],
                'risk_factors': [],
                'market_context': 'Unable to parse market context'
            }
    
    def get_quick_advice(self, stock_name, verdict):
        """Get quick AI advice based on verdict"""
        if not self.model:
            return "AI advisor not available"
        
        try:
            prompt = f"""
            Given that {stock_name} has a verdict of {verdict}, provide a brief (2-3 sentences) 
            investment advice for a retail investor. Be practical and actionable.
            """
            
            response = self.model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            return f"Unable to get AI advice: {str(e)}" 
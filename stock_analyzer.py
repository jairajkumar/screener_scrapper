from config import STOCK_CRITERIA

class StockAnalyzer:
    def __init__(self):
        self.criteria = STOCK_CRITERIA
        
    def analyze_stock(self, financial_data):
        """Analyze stock based on investment criteria"""
        if not financial_data:
            return {
                'verdict': 'NA',
                'reason': 'No financial data available',
                'score': 0,
                'analysis': {}
            }
        
        analysis = {}
        score = 0
        total_criteria = 8  # Total number of criteria to check
        
        # 1. ROE > 15%
        roe = financial_data.get('roe')
        if roe is not None:
            if roe > self.criteria['roe_min']:
                analysis['roe'] = {'status': 'PASS', 'value': roe, 'threshold': self.criteria['roe_min']}
                score += 1
            else:
                analysis['roe'] = {'status': 'FAIL', 'value': roe, 'threshold': self.criteria['roe_min']}
        else:
            analysis['roe'] = {'status': 'NA', 'value': None, 'threshold': self.criteria['roe_min']}
            total_criteria -= 1
        
        # 2. P/E Ratio < 20
        pe_ratio = financial_data.get('pe_ratio')
        if pe_ratio is not None:
            if pe_ratio < self.criteria['pe_max']:
                analysis['pe_ratio'] = {'status': 'PASS', 'value': pe_ratio, 'threshold': self.criteria['pe_max']}
                score += 1
            else:
                analysis['pe_ratio'] = {'status': 'FAIL', 'value': pe_ratio, 'threshold': self.criteria['pe_max']}
        else:
            analysis['pe_ratio'] = {'status': 'NA', 'value': None, 'threshold': self.criteria['pe_max']}
            total_criteria -= 1
        
        # 3. Debt-to-Equity < 0.5
        debt_to_equity = financial_data.get('debt_to_equity')
        if debt_to_equity is not None:
            if debt_to_equity < self.criteria['debt_to_equity_max']:
                analysis['debt_to_equity'] = {'status': 'PASS', 'value': debt_to_equity, 'threshold': self.criteria['debt_to_equity_max']}
                score += 1
            else:
                analysis['debt_to_equity'] = {'status': 'FAIL', 'value': debt_to_equity, 'threshold': self.criteria['debt_to_equity_max']}
        else:
            analysis['debt_to_equity'] = {'status': 'NA', 'value': None, 'threshold': self.criteria['debt_to_equity_max']}
            total_criteria -= 1
        
        # 4. ROCE > 15%
        roce = financial_data.get('roce')
        if roce is not None:
            if roce > self.criteria['roce_min']:
                analysis['roce'] = {'status': 'PASS', 'value': roce, 'threshold': self.criteria['roce_min']}
                score += 1
            else:
                analysis['roce'] = {'status': 'FAIL', 'value': roce, 'threshold': self.criteria['roce_min']}
        else:
            analysis['roce'] = {'status': 'NA', 'value': None, 'threshold': self.criteria['roce_min']}
            total_criteria -= 1
        
        # 5. Cash Flow Positive
        cash_flow = financial_data.get('cash_flow')
        if cash_flow is not None:
            if cash_flow > 0:
                analysis['cash_flow'] = {'status': 'PASS', 'value': cash_flow, 'threshold': 0}
                score += 1
            else:
                analysis['cash_flow'] = {'status': 'FAIL', 'value': cash_flow, 'threshold': 0}
        else:
            analysis['cash_flow'] = {'status': 'NA', 'value': None, 'threshold': 0}
            total_criteria -= 1
        
        # 6. EPS Growth 10-15%
        eps_growth = financial_data.get('eps_growth')
        if eps_growth is not None:
            if self.criteria['eps_growth_min'] <= eps_growth <= self.criteria['eps_growth_max']:
                analysis['eps_growth'] = {'status': 'PASS', 'value': eps_growth, 'threshold': f"{self.criteria['eps_growth_min']}-{self.criteria['eps_growth_max']}%"}
                score += 1
            else:
                analysis['eps_growth'] = {'status': 'FAIL', 'value': eps_growth, 'threshold': f"{self.criteria['eps_growth_min']}-{self.criteria['eps_growth_max']}%"}
        else:
            analysis['eps_growth'] = {'status': 'NA', 'value': None, 'threshold': f"{self.criteria['eps_growth_min']}-{self.criteria['eps_growth_max']}%"}
            total_criteria -= 1
        
        # 7. PEG < 1
        peg = financial_data.get('peg')
        if peg is not None:
            if peg < self.criteria['peg_max']:
                analysis['peg'] = {'status': 'PASS', 'value': peg, 'threshold': self.criteria['peg_max']}
                score += 1
            else:
                analysis['peg'] = {'status': 'FAIL', 'value': peg, 'threshold': self.criteria['peg_max']}
        else:
            analysis['peg'] = {'status': 'NA', 'value': None, 'threshold': self.criteria['peg_max']}
            total_criteria -= 1
        
        # 8. Intrinsic Value Calculation
        eps = financial_data.get('eps')
        book_value = financial_data.get('book_value')
        if eps is not None and book_value is not None:
            intrinsic_value = self.criteria['intrinsic_value_multiplier'] * eps * book_value
            analysis['intrinsic_value'] = {'status': 'CALCULATED', 'value': intrinsic_value, 'formula': f"{self.criteria['intrinsic_value_multiplier']} × EPS × BV"}
        else:
            analysis['intrinsic_value'] = {'status': 'NA', 'value': None, 'formula': f"{self.criteria['intrinsic_value_multiplier']} × EPS × BV"}
            total_criteria -= 1
        
        # Calculate final score and verdict
        if total_criteria > 0:
            score_percentage = (score / total_criteria) * 100
        else:
            score_percentage = 0
        
        # Determine verdict
        if score_percentage >= 70:
            verdict = 'BUY'
            reason = f"Stock meets {score}/{total_criteria} criteria ({score_percentage:.1f}%)"
        elif score_percentage >= 50:
            verdict = 'HOLD'
            reason = f"Stock meets {score}/{total_criteria} criteria ({score_percentage:.1f}%) - Consider holding"
        else:
            verdict = 'NA'
            reason = f"Stock meets only {score}/{total_criteria} criteria ({score_percentage:.1f}%) - Not recommended"
        
        return {
            'verdict': verdict,
            'reason': reason,
            'score': score,
            'total_criteria': total_criteria,
            'score_percentage': score_percentage,
            'analysis': analysis
        }
    
    def get_detailed_analysis(self, analysis_result):
        """Get detailed analysis breakdown"""
        analysis = analysis_result['analysis']
        details = []
        
        for metric, data in analysis.items():
            if data['status'] == 'PASS':
                details.append(f"✅ {metric.upper()}: {data['value']} (Target: {data['threshold']})")
            elif data['status'] == 'FAIL':
                details.append(f"❌ {metric.upper()}: {data['value']} (Target: {data['threshold']})")
            elif data['status'] == 'CALCULATED':
                details.append(f"📊 {metric.upper()}: {data['value']:.2f} ({data['formula']})")
            else:
                details.append(f"⚠️ {metric.upper()}: Data not available")
        
        return details 
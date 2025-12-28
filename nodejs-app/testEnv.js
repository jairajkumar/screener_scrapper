// testEnv.js - Test environment variable configuration
require('dotenv').config();
const { LOGIN, GEMINI_API_KEY, PORT, CRITERIA } = require('./config');

console.log('🔧 Environment Variable Test');
console.log('============================');

console.log('\n📧 Screener.in Credentials:');
console.log(`   Email: ${LOGIN.email ? '✅ Set' : '❌ Not set'}`);
console.log(`   Password: ${LOGIN.password ? '✅ Set' : '❌ Not set'}`);

console.log('\n🤖 Gemini AI:');
console.log(`   API Key: ${GEMINI_API_KEY ? '✅ Set' : '❌ Not set'}`);

console.log('\n⚙️ Server Configuration:');
console.log(`   Port: ${PORT}`);
console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);

console.log('\n📊 Investment Criteria:');
console.log(`   ROE Min: ${CRITERIA.roe_min}%`);
console.log(`   P/E Max: ${CRITERIA.pe_max}`);
console.log(`   Debt-to-Equity Max: ${CRITERIA.debt_to_equity_max}`);
console.log(`   ROCE Min: ${CRITERIA.roce_min}%`);
console.log(`   EPS Growth Range: ${CRITERIA.eps_growth_min}-${CRITERIA.eps_growth_max}%`);
console.log(`   PEG Max: ${CRITERIA.peg_max}`);
console.log(`   Intrinsic Value Multiplier: ${CRITERIA.intrinsic_value_multiplier}`);

console.log('\n💡 Recommendations:');
if (!LOGIN.email || !LOGIN.password) {
  console.log('   ⚠️  Set SCREENER_EMAIL and SCREENER_PASSWORD for full data access');
}
if (!GEMINI_API_KEY) {
  console.log('   ⚠️  Set GEMINI_API_KEY for AI-powered insights');
}
if (LOGIN.email && LOGIN.password && GEMINI_API_KEY) {
  console.log('   ✅ All environment variables are properly configured!');
}

console.log('\n🚀 Ready to run the application!'); 
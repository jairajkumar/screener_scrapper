const fetchStockData = require('./fetchData');

async function testLogin() {
  console.log('🧪 Testing login functionality...');
  
  try {
    // Test with a simple stock to see if login works
    const result = await fetchStockData('RELIANCE');
    
    if (result) {
      console.log('✅ Test completed successfully');
      console.log('📊 Result:', result);
    } else {
      console.log('❌ Test failed - no data returned');
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
}

// Run the test
testLogin();

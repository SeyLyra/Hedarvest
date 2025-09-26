const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

async function testInvestorDeposit() {
  try {
    console.log('🧪 Testing Investor Deposit with HCS integration...');
    
    const response = await axios.post(`${API_BASE_URL}/investor/deposit`, {
      grainType: 'Rice',
      amount: 100,
      depositorAddress: '0x1234567890abcdef'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Investor deposit successful!');
    console.log('📝 Response:', response.data);
    
    if (response.data.transactions?.hederaTxId) {
      console.log('🔗 Hedera Transaction ID:', response.data.transactions.hederaTxId);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.data);
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

async function testGetPools() {
  try {
    console.log('🧪 Testing Get Available Pools...');
    
    const response = await axios.get(`${API_BASE_URL}/investor/pools`);
    
    console.log('✅ Get pools successful!');
    console.log('📊 Available pools:', response.data.length);
    
    if (response.data.length > 0) {
      console.log('🌾 First pool:', {
        grainType: response.data[0].grainType,
        availableLiquidity: response.data[0].availableLiquidity,
        apr: response.data[0].apr
      });
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.data);
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

async function runTests() {
  console.log('🚀 Starting HCS Integration Tests...\n');
  
  // Wait for backend to be ready
  console.log('⏳ Waiting for backend to be ready...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await testGetPools();
  console.log('\n' + '='.repeat(50) + '\n');
  await testInvestorDeposit();
  
  console.log('\n🎉 HCS Integration tests completed!');
  console.log('💡 Check your backend logs for HCS [MOCK MODE] events');
}

runTests().catch(console.error);

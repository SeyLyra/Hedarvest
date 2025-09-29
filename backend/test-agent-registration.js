const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

async function testAgentRegistration() {
  try {
    console.log('Testing Agent Registration...');
    
    const testAgent = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      phoneNumber: '+1234567890',
      location: 'New York, USA'
    };

    console.log('Sending registration request...');
    const response = await axios.post(`${API_BASE_URL}/agents/register`, testAgent);
    
    console.log('✅ Registration successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Registration failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Test if server is running
async function testServerConnection() {
  try {
    console.log('Testing server connection...');
    const response = await axios.get(`${API_BASE_URL}/agents`);
    console.log('✅ Server is running!');
    console.log('Agents count:', response.data.length);
  } catch (error) {
    console.error('❌ Server connection failed:');
    console.error('Error:', error.message);
    console.log('\nMake sure the backend server is running on port 3001');
  }
}

async function runTests() {
  await testServerConnection();
  console.log('\n' + '='.repeat(50) + '\n');
  await testAgentRegistration();
}

runTests();

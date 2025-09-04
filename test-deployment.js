// Test script to verify backend deployment
const https = require('https');

// Replace with your actual backend URL after deployment
const BACKEND_URL = 'https://your-backend-url.com';

console.log('🧪 Testing Connectrix Backend Deployment...\n');

// Test health endpoint
function testHealthEndpoint() {
  return new Promise((resolve, reject) => {
    const url = `${BACKEND_URL}/api/health`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Health endpoint test passed');
          console.log('📊 Response:', response);
          resolve(response);
        } catch (error) {
          console.log('❌ Health endpoint test failed - Invalid JSON');
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.log('❌ Health endpoint test failed - Connection error');
      console.log('🔍 Error:', error.message);
      reject(error);
    });
  });
}

// Test CORS
function testCORS() {
  return new Promise((resolve, reject) => {
    const url = `${BACKEND_URL}/api/health`;
    
    const options = {
      method: 'GET',
      headers: {
        'Origin': 'https://cconnect-7f562.web.app',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    };
    
    const req = https.request(url, options, (res) => {
      const corsHeaders = {
        'access-control-allow-origin': res.headers['access-control-allow-origin'],
        'access-control-allow-methods': res.headers['access-control-allow-methods'],
        'access-control-allow-headers': res.headers['access-control-allow-headers']
      };
      
      console.log('✅ CORS test passed');
      console.log('📊 CORS Headers:', corsHeaders);
      resolve(corsHeaders);
    });
    
    req.on('error', (error) => {
      console.log('❌ CORS test failed');
      console.log('🔍 Error:', error.message);
      reject(error);
    });
    
    req.end();
  });
}

// Run tests
async function runTests() {
  console.log(`🔗 Testing backend at: ${BACKEND_URL}\n`);
  
  try {
    await testHealthEndpoint();
    console.log('');
    await testCORS();
    console.log('\n🎉 All tests passed! Your backend is working correctly.');
    console.log('\n📋 Next steps:');
    console.log('1. Update src/config/api.js with your backend URL');
    console.log('2. Run: npm run build && firebase deploy --only hosting');
    console.log('3. Test the full authentication flow');
  } catch (error) {
    console.log('\n❌ Some tests failed. Please check your deployment.');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify your backend URL is correct');
    console.log('2. Check that the server is running');
    console.log('3. Ensure environment variables are set');
    console.log('4. Check server logs for errors');
  }
}

// Check if URL is updated
if (BACKEND_URL.includes('your-backend-url.com')) {
  console.log('⚠️  Please update the BACKEND_URL in this script with your actual backend URL');
  console.log('📝 Edit test-deployment.js and replace "your-backend-url.com" with your actual URL');
  console.log('🚀 Then run: node test-deployment.js');
} else {
  runTests();
}

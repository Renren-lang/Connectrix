// CONNECTRIX Functionality Test Script
// Run this in browser console on both localhost and live app

console.log('🔍 CONNECTRIX Functionality Test Starting...');

// Test 1: Check if Firebase is loaded
function testFirebase() {
    console.log('📱 Testing Firebase Configuration...');
    
    try {
        // Check if Firebase is available
        if (typeof firebase !== 'undefined') {
            console.log('✅ Firebase SDK loaded');
            return true;
        } else {
            console.log('❌ Firebase SDK not loaded');
            return false;
        }
    } catch (error) {
        console.log('❌ Firebase error:', error);
        return false;
    }
}

// Test 2: Check Authentication
function testAuthentication() {
    console.log('🔐 Testing Authentication...');
    
    try {
        // Check if auth is available
        if (window.auth) {
            console.log('✅ Auth service available');
            return true;
        } else {
            console.log('❌ Auth service not available');
            return false;
        }
    } catch (error) {
        console.log('❌ Auth error:', error);
        return false;
    }
}

// Test 3: Check Firestore
function testFirestore() {
    console.log('🗄️ Testing Firestore...');
    
    try {
        if (window.db) {
            console.log('✅ Firestore service available');
            return true;
        } else {
            console.log('❌ Firestore service not available');
            return false;
        }
    } catch (error) {
        console.log('❌ Firestore error:', error);
        return false;
    }
}

// Test 4: Check React App
function testReactApp() {
    console.log('⚛️ Testing React App...');
    
    try {
        // Check if React is loaded
        if (window.React) {
            console.log('✅ React loaded');
        } else {
            console.log('❌ React not loaded');
        }
        
        // Check if app container exists
        const appContainer = document.getElementById('root');
        if (appContainer) {
            console.log('✅ App container found');
            return true;
        } else {
            console.log('❌ App container not found');
            return false;
        }
    } catch (error) {
        console.log('❌ React App error:', error);
        return false;
    }
}

// Test 5: Check Console Errors
function testConsoleErrors() {
    console.log('🚨 Checking for Console Errors...');
    
    // Override console.error to catch errors
    const originalError = console.error;
    let errorCount = 0;
    
    console.error = function(...args) {
        errorCount++;
        originalError.apply(console, args);
        console.log(`❌ Error #${errorCount}:`, args);
    };
    
    // Check for common error patterns
    const errorPatterns = [
        'Firebase',
        'auth',
        'firestore',
        'network',
        'CORS',
        'permission'
    ];
    
    console.log(`📊 Error count: ${errorCount}`);
    return errorCount === 0;
}

// Test 6: Check Network Requests
function testNetworkRequests() {
    console.log('🌐 Testing Network Requests...');
    
    try {
        // Test Firebase API connectivity
        fetch('https://cconnect-7f562.firebaseapp.com')
            .then(response => {
                console.log('✅ Firebase API reachable');
                return true;
            })
            .catch(error => {
                console.log('❌ Firebase API not reachable:', error);
                return false;
            });
    } catch (error) {
        console.log('❌ Network test error:', error);
        return false;
    }
}

// Run all tests
function runAllTests() {
    console.log('🚀 Running All Tests...');
    console.log('='.repeat(50));
    
    const results = {
        firebase: testFirebase(),
        authentication: testAuthentication(),
        firestore: testFirestore(),
        reactApp: testReactApp(),
        consoleErrors: testConsoleErrors(),
        networkRequests: testNetworkRequests()
    };
    
    console.log('='.repeat(50));
    console.log('📊 Test Results Summary:');
    
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const passedCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    
    console.log(`\n🎯 Overall Score: ${passedCount}/${totalCount} tests passed`);
    
    return results;
}

// Auto-run tests
setTimeout(() => {
    runAllTests();
}, 2000);

// Export for manual testing
window.testConnectrix = {
    runAllTests,
    testFirebase,
    testAuthentication,
    testFirestore,
    testReactApp,
    testConsoleErrors,
    testNetworkRequests
};

console.log('🔧 Test functions available as window.testConnectrix');

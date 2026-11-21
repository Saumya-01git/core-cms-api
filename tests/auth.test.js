const http = require('http');
const app = require('../src/app');

async function runTests() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/auth`;
  console.log(`🧪 Test server running at ${baseUrl}`);

  let failed = 0;
  const assert = (condition, msg) => {
    if (!condition) {
      console.error(`❌ FAILED: ${msg}`);
      failed++;
    } else {
      console.log(`✅ PASSED: ${msg}`);
    }
  };

  try {
    // 1. Invalid Login
    console.log('\n--- 1. Testing Invalid Login ---');
    const res1 = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@portfolio.local', password: 'WrongPassword' })
    });
    const data1 = await res1.json();
    assert(res1.status === 401 && !data1.success, 'Rejects invalid password with 401');

    // 2. Successful Login
    console.log('\n--- 2. Testing Successful Login ---');
    const res2 = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@portfolio.local', password: 'Admin@123456' })
    });
    const data2 = await res2.json();
    assert(res2.status === 200 && data2.success, 'Returns 200 on valid credentials');
    assert(typeof data2.token === 'string', 'Returns JWT access token');
    assert(typeof data2.refreshToken === 'string', 'Returns refresh token');
    const token = data2.token;
    const refreshToken = data2.refreshToken;

    // 3. Protected route without token
    console.log('\n--- 3. Testing Protected Route Without Token ---');
    const res3 = await fetch(`${baseUrl}/me`);
    const data3 = await res3.json();
    assert(res3.status === 401, 'Rejects request without Authorization header with 401');

    // 4. Protected route with invalid token
    console.log('\n--- 4. Testing Protected Route With Malformed Token ---');
    const res4 = await fetch(`${baseUrl}/me`, {
      headers: { 'Authorization': 'Bearer bad_token_123' }
    });
    assert(res4.status === 401, 'Rejects invalid JWT token with 401');

    // 5. Protected route with valid token
    console.log('\n--- 5. Testing Protected Route With Valid Token ---');
    const res5 = await fetch(`${baseUrl}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data5 = await res5.json();
    assert(res5.status === 200 && data5.success, 'Returns 200 for authenticated user');
    assert(data5.user.email === 'admin@portfolio.local', 'Returns correct user profile');

    // 6. Refresh token
    console.log('\n--- 6. Testing Token Refresh ---');
    const res6 = await fetch(`${baseUrl}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    const data6 = await res6.json();
    assert(res6.status === 200 && typeof data6.token === 'string', 'Successfully issues refreshed access token');

    console.log(`\n========================================`);
    if (failed === 0) {
      console.log('🎉 ALL DAY 2 AUTHENTICATION TESTS PASSED!');
    } else {
      console.error(`❌ ${failed} TESTS FAILED!`);
      process.exit(1);
    }
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});

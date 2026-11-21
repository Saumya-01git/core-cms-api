const http = require('http');
const app = require('../src/app');

async function runUploadTests() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;
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
    // 0. Login
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@portfolio.local', password: 'Admin@123456' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    // 1. Unauthorized upload attempt
    console.log('\n--- 1. Testing Unauthorized Upload ---');
    const unauthRes = await fetch(`${baseUrl}/upload`, { method: 'POST' });
    assert(unauthRes.status === 401, 'Rejects unauthenticated upload with 401');

    // 2. Upload single image
    console.log('\n--- 2. Testing Single Image Upload ---');
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const fakePng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89
    ]);

    const multipartBody = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test-avatar.png"\r\nContent-Type: image/png\r\n\r\n`),
      fakePng,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const uploadRes = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: multipartBody
    });

    const uploadData = await uploadRes.json();
    assert(uploadRes.status === 201 && uploadData.success, 'Uploads image file successfully');
    assert(typeof uploadData.data.url === 'string' && uploadData.data.url.startsWith('/uploads/'), 'Returns valid static URL');
    const mediaId = uploadData.data.id;

    // 3. List media library
    console.log('\n--- 3. Testing Get Media Library ---');
    const listRes = await fetch(`${baseUrl}/upload`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const listData = await listRes.json();
    assert(listData.success && listData.data.some(m => m.id === mediaId), 'Lists newly uploaded media record');

    // 4. Delete media
    console.log('\n--- 4. Testing Delete Media ---');
    const delRes = await fetch(`${baseUrl}/upload/${mediaId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const delData = await delRes.json();
    assert(delRes.status === 200 && delData.success, 'Deletes media record successfully');

    console.log(`\n========================================`);
    if (failed === 0) {
      console.log('🎉 ALL DAY 4 FILE UPLOAD TESTS PASSED!');
    } else {
      console.error(`❌ ${failed} TESTS FAILED!`);
      process.exit(1);
    }
  } finally {
    server.close();
  }
}

runUploadTests().catch(err => {
  console.error('Upload test execution error:', err);
  process.exit(1);
});

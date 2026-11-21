const http = require('http');
const app = require('../src/app');

async function testAdmin() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
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
    // 1. Root route
    const rootRes = await fetch(`${baseUrl}/`);
    const rootData = await rootRes.json();
    assert(rootData.adminPanel === '/admin', 'Root lists /admin discovery route');

    // 2. Admin index.html
    const adminRes = await fetch(`${baseUrl}/admin/`);
    const adminHtml = await adminRes.text();
    assert(adminRes.status === 200 && adminHtml.includes('Core CMS — Headless Portfolio Admin'), 'Serves Admin Panel HTML on /admin/');

    // 3. Admin app.jsx
    const jsxRes = await fetch(`${baseUrl}/admin/app.jsx`);
    const jsxText = await jsxRes.text();
    assert(jsxRes.status === 200 && jsxText.includes('AdminLayout'), 'Serves Admin React SPA component bundle');

    console.log(`\n========================================`);
    if (failed === 0) {
      console.log('🎉 ALL DAY 5, 6, 7 ADMIN PANEL TESTS PASSED!');
    } else {
      console.error(`❌ ${failed} TESTS FAILED!`);
      process.exit(1);
    }
  } finally {
    server.close();
  }
}

testAdmin().catch(e => {
  console.error(e);
  process.exit(1);
});


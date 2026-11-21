const http = require('http');
const app = require('../src/app');

async function runCrudTests() {
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
    // 0. Login to get auth token
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@portfolio.local', password: 'Admin@123456' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 1. About CRUD
    console.log('\n--- 1. Testing About API ---');
    const getAbout = await (await fetch(`${baseUrl}/about`)).json();
    assert(getAbout.success && getAbout.data, 'GET /api/about succeeds');

    const updateAbout = await (await fetch(`${baseUrl}/about`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Full Stack Architect', bio: 'Senior software craftsperson' })
    })).json();
    assert(updateAbout.success && updateAbout.data.title === 'Full Stack Architect', 'PUT /api/about succeeds');

    // 2. Skills CRUD
    console.log('\n--- 2. Testing Skills API ---');
    const createSkill = await (await fetch(`${baseUrl}/skills`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'TypeScript', category: 'Frontend', proficiency: 90 })
    })).json();
    assert(createSkill.success && createSkill.data.id, 'POST /api/skills succeeds');
    const skillId = createSkill.data.id;

    const getSkills = await (await fetch(`${baseUrl}/skills`)).json();
    assert(getSkills.success && getSkills.data.some(s => s.id === skillId), 'GET /api/skills lists skill');

    const updateSkill = await (await fetch(`${baseUrl}/skills/${skillId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ proficiency: 95 })
    })).json();
    assert(updateSkill.success && updateSkill.data.proficiency === 95, 'PUT /api/skills/:id succeeds');

    const deleteSkill = await (await fetch(`${baseUrl}/skills/${skillId}`, {
      method: 'DELETE',
      headers: authHeaders
    })).json();
    assert(deleteSkill.success, 'DELETE /api/skills/:id succeeds');

    // 3. Projects CRUD
    console.log('\n--- 3. Testing Projects API ---');
    const createProject = await (await fetch(`${baseUrl}/projects`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Core CMS Engine',
        description: 'A custom headless CMS built with Node and Prisma',
        tags: ['Node.js', 'Express', 'Prisma', 'PostgreSQL'],
        isFeatured: true
      })
    })).json();
    assert(createProject.success && createProject.data.slug, 'POST /api/projects succeeds with slug generation');
    const projectId = createProject.data.id;
    const projectSlug = createProject.data.slug;

    const getProjBySlug = await (await fetch(`${baseUrl}/projects/${projectSlug}`)).json();
    assert(getProjBySlug.success && getProjBySlug.data.id === projectId, 'GET /api/projects/:slug succeeds');

    const updateProj = await (await fetch(`${baseUrl}/projects/${projectId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ isFeatured: false })
    })).json();
    assert(updateProj.success && updateProj.data.isFeatured === false, 'PUT /api/projects/:id succeeds');

    const deleteProj = await (await fetch(`${baseUrl}/projects/${projectId}`, {
      method: 'DELETE',
      headers: authHeaders
    })).json();
    assert(deleteProj.success, 'DELETE /api/projects/:id succeeds');

    // 4. Blogs CRUD
    console.log('\n--- 4. Testing Blogs API ---');
    const createBlog = await (await fetch(`${baseUrl}/blogs`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'How to Build a Custom Headless CMS',
        excerpt: 'Step-by-step engineering tutorial.',
        content: '# Architecture\nDetailed guide to custom CMS.',
        tags: ['Engineering', 'Architecture'],
        isPublished: true
      })
    })).json();
    assert(createBlog.success && createBlog.data.slug, 'POST /api/blogs succeeds');
    const blogId = createBlog.data.id;
    const blogSlug = createBlog.data.slug;

    const getBlog = await (await fetch(`${baseUrl}/blogs/${blogSlug}`)).json();
    assert(getBlog.success && getBlog.data.views >= 1, 'GET /api/blogs/:slug succeeds & increments view counter');

    const deleteBlog = await (await fetch(`${baseUrl}/blogs/${blogId}`, {
      method: 'DELETE',
      headers: authHeaders
    })).json();
    assert(deleteBlog.success, 'DELETE /api/blogs/:id succeeds');

    // 5. Experience CRUD
    console.log('\n--- 5. Testing Experience API ---');
    const createExp = await (await fetch(`${baseUrl}/experience`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        role: 'Lead Architect',
        company: 'Apex Systems',
        startDate: '2024-01',
        isCurrent: true,
        description: 'Driving platform architecture and developer tools.'
      })
    })).json();
    assert(createExp.success && createExp.data.id, 'POST /api/experience succeeds');
    const expId = createExp.data.id;

    const deleteExp = await (await fetch(`${baseUrl}/experience/${expId}`, {
      method: 'DELETE',
      headers: authHeaders
    })).json();
    assert(deleteExp.success, 'DELETE /api/experience/:id succeeds');

    // 6. Testimonials CRUD
    console.log('\n--- 6. Testing Testimonials API ---');
    const createTestimonial = await (await fetch(`${baseUrl}/testimonials`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        authorName: 'Alex Mercer',
        authorRole: 'VP of Product',
        content: 'Exceptional craftsmanship and attention to detail.'
      })
    })).json();
    assert(createTestimonial.success && createTestimonial.data.id, 'POST /api/testimonials succeeds');
    const testId = createTestimonial.data.id;

    const deleteTestimonial = await (await fetch(`${baseUrl}/testimonials/${testId}`, {
      method: 'DELETE',
      headers: authHeaders
    })).json();
    assert(deleteTestimonial.success, 'DELETE /api/testimonials/:id succeeds');

    // 7. Services CRUD
    console.log('\n--- 7. Testing Services API ---');
    const createService = await (await fetch(`${baseUrl}/services`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Full-Stack Web Development',
        description: 'End-to-end web apps crafted with modern technologies.',
        features: ['API Design', 'Performance Tuning']
      })
    })).json();
    assert(createService.success && createService.data.id, 'POST /api/services succeeds');
    const serviceId = createService.data.id;

    const deleteService = await (await fetch(`${baseUrl}/services/${serviceId}`, {
      method: 'DELETE',
      headers: authHeaders
    })).json();
    assert(deleteService.success, 'DELETE /api/services/:id succeeds');

    // 8. Contact API
    console.log('\n--- 8. Testing Contact API ---');
    const contactRes = await (await fetch(`${baseUrl}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Doe',
        email: 'jane@example.com',
        subject: 'Collaboration Inquiry',
        message: 'Hi, I would love to discuss a project with you.'
      })
    })).json();
    assert(contactRes.success && contactRes.data.id, 'POST /api/contact submits message');
    const messageId = contactRes.data.id;

    const messagesList = await (await fetch(`${baseUrl}/contact`, { headers: authHeaders })).json();
    assert(messagesList.success && messagesList.data.some(m => m.id === messageId), 'GET /api/contact lists message in admin inbox');

    const deleteMsg = await (await fetch(`${baseUrl}/contact/${messageId}`, {
      method: 'DELETE',
      headers: authHeaders
    })).json();
    assert(deleteMsg.success, 'DELETE /api/contact/:id succeeds');

    console.log(`\n========================================`);
    if (failed === 0) {
      console.log('🎉 ALL DAY 3 CONTENT MODELS & CRUD TESTS PASSED!');
    } else {
      console.error(`❌ ${failed} TESTS FAILED!`);
      process.exit(1);
    }
  } finally {
    server.close();
  }
}

runCrudTests().catch(err => {
  console.error('CRUD test execution error:', err);
  process.exit(1);
});

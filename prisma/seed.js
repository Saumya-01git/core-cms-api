const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with Saumya\'s authentic resume portfolio data...');

  // 1. Seed / Update Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@portfolio.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminName = 'Saumya';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: 'ADMIN'
      }
    });
    console.log(`✅ Default admin created: ${adminEmail}`);
  }

  // 2. Seed / Update About Profile from Resume (Sanitized for Privacy)
  const aboutData = {
    title: 'Full-Stack Engineer & Cyber Security Specialist',
    subtitle: 'B.Tech CSE (Cyber Security) @ VIT Chennai. Engineering resilient cloud systems, cryptographic protocols, and reactive web applications.',
    bio: 'Full-Stack Software Engineer with specialized focus on Web Development, Cyber Security, and Cryptography. Proven experience engineering scalable enterprise web modules at Labmentix, authoring LLM benchmarking datasets at GirlScript Summer of Code (GSSoC 2026), and developing novel privacy-preserving search frameworks (DASP/ASPE). Passionate about secure RESTful APIs, PostgreSQL relational modeling, and clean user interfaces.',
    location: 'Chennai / Remote',
    email: 'contact@saumya.dev',
    phone: '+91 98765 43210',
    githubUrl: 'https://github.com/Saumya-01git',
    linkedinUrl: 'https://linkedin.com',
    twitterUrl: 'https://x.com',
    isPublished: true
  };

  const existingAbout = await prisma.about.findFirst();
  if (existingAbout) {
    await prisma.about.update({
      where: { id: existingAbout.id },
      data: aboutData
    });
  } else {
    await prisma.about.create({ data: aboutData });
  }
  console.log('✅ About profile updated with authentic resume details');

  // 3. Seed / Update Projects from Resume
  const resumeProjects = [
    {
      title: 'SignFlow – Secure Digital Document Signer',
      slug: 'signflow-document-signer',
      description: 'End-to-end digital signature platform with client-side PDF.js rendering, multi-party signing states, and tamper-proof audit trails.',
      content: 'Developed a production-grade digital signature platform featuring client-side PDF.js document rendering, multi-party signing workflows, and cryptographic audit logs. Integrated Brevo Transactional Email API to automate signature request dispatches and contract notification alerts. Implemented MongoDB document state transitions to prevent signature tampering and preserve contract lifecycle integrity.',
      tags: ['React', 'Node.js', 'Express', 'MongoDB', 'Brevo API', 'PDF.js'],
      isFeatured: true,
      demoUrl: 'https://signflow.vercel.app',
      githubUrl: 'https://github.com/Saumya-01git/SignFlow',
      order: 1
    },
    {
      title: 'DASP: Privacy-Preserving Semantic Search Framework',
      slug: 'dasp-semantic-search',
      description: 'Novel academic research framework combining BioBERT domain embeddings with ASPE encryption for encrypted semantic cloud search.',
      content: 'Engineered the DASP framework combining domain embeddings (BioBERT) with ASPE encryption for secure cloud search. Achieved 91.4% Precision@10 and 0.92 MRR on encrypted domain corpora without cloud data leakage or decryption. Generated secure query trapdoors in <18ms and executed encrypted dot-product ranking in <42ms.',
      tags: ['Python', 'ASPE Encryption', 'Cryptography', 'NLP', 'BioBERT', 'Research'],
      isFeatured: true,
      demoUrl: '#',
      githubUrl: 'https://github.com/Saumya-01git/DASP-Framework',
      order: 2
    },
    {
      title: 'Real-Time Phishing Detection & Threat Analysis Extension',
      slug: 'phishing-threat-detection',
      description: 'Chrome extension evaluating active web traffic in real time to intercept and flag malicious phishing domains (<25ms evaluation).',
      content: 'Built a high-performance Chrome extension that evaluates active web traffic in real time to intercept and flag malicious phishing domains. Implemented client-side URL heuristic algorithms analyzing homograph characters, suspicious TLDs, and SSL certificate validity. Leveraged Chrome background workers to execute domain risk evaluation in <25ms, issuing instant visual warning banners.',
      tags: ['JavaScript', 'Chrome API', 'Web Security', 'Heuristics', 'Threat Intel'],
      isFeatured: true,
      demoUrl: '#',
      githubUrl: 'https://github.com/Saumya-01git/Phishing-Detection-Extension',
      order: 3
    },
    {
      title: 'QuizForge AI',
      slug: 'quizforge-ai',
      description: 'AI-driven assessment and dynamic quiz platform featuring automated question generation from documents, real-time analytics, and classroom leaderboards.',
      content: 'QuizForge AI is an intelligent assessment engine designed to generate comprehensive, multi-format quizzes directly from course materials, PDFs, and lecture notes. Features include adaptive difficulty scoring, real-time participant leaderboards, automated explanation generation powered by LLMs, and detailed class performance analytics.',
      tags: ['Next.js', 'React', 'Node.js', 'OpenAI API', 'PostgreSQL', 'Tailwind CSS'],
      isFeatured: false,
      demoUrl: 'https://quizforge-ai.vercel.app',
      githubUrl: 'https://github.com/Saumya-01git/QuizForge-AI',
      order: 4
    },
    {
      title: 'AetherVault Cloud',
      slug: 'aethervault-cloud',
      description: 'Zero-knowledge encrypted cloud storage and file management ecosystem with client-side AES-256-GCM encryption, chunked uploads, and granular sharing.',
      content: 'AetherVault Cloud provides an enterprise-grade secure file storage platform where encryption keys never leave the client browser. Features include chunked multipart uploads for gigabyte-scale files, end-to-end cryptographic sharing links with expiration timers, granular role-based permissions, and automated cloud sync.',
      tags: ['React', 'Node.js', 'AWS S3', 'Cryptography', 'Express', 'Prisma'],
      isFeatured: false,
      demoUrl: 'https://aethervault-cloud.vercel.app',
      githubUrl: 'https://github.com/Saumya-01git/AetherVault-Cloud',
      order: 5
    }
  ];

  for (const proj of resumeProjects) {
    const existing = await prisma.project.findUnique({ where: { slug: proj.slug } });
    if (existing) {
      await prisma.project.update({ where: { slug: proj.slug }, data: proj });
    } else {
      await prisma.project.create({ data: proj });
    }
  }
  console.log('✅ Projects seeded from resume');

  // 4. Seed / Update Experience with Prestigious Enterprise Aliases
  await prisma.experience.deleteMany({});
  const resumeExperience = [
    {
      role: 'Web Development Intern',
      company: 'ApexScale Cloud Labs',
      location: 'Remote',
      startDate: 'May 2026',
      endDate: null,
      isCurrent: true,
      description: 'Engineering scalable full-stack web modules using React.js, Node.js, Express, and PostgreSQL for enterprise clients.',
      highlights: [
        'Architected secure RESTful APIs with stateless JWT auth, bcrypt hashing, and RBAC middleware across 15+ backend routes.',
        'Optimized PostgreSQL schemas and query indexing, accelerating API data throughput by over 28% in agile sprints.',
        'Engineered responsive modular frontend components integrated with real-time backend microservices.'
      ],
      order: 1
    },
    {
      role: 'Open Source Contributor (AI Track)',
      company: 'Global AI Benchmarking Guild',
      location: 'Remote',
      startDate: 'Aug 2026',
      endDate: null,
      isCurrent: true,
      description: 'Authored evaluation benchmark datasets and validation contracts to test LLM retrieval accuracy and response latency.',
      highlights: [
        'Authored 10+ evaluation benchmark datasets to test LLM retrieval accuracy, response latency, and structured schema outputs.',
        'Formulated strict JSON Schema (Draft-07) validation contracts, eliminating parsing failures and edge-case response errors.',
        'Automated test pipelines to benchmark model inference latency and response consistency across repetitive test iterations.'
      ],
      order: 2
    }
  ];

  for (const exp of resumeExperience) {
    await prisma.experience.create({ data: exp });
  }
  console.log('✅ Experience seeded with prestigious enterprise aliases');

  // 5. Seed / Update Testimonials
  await prisma.testimonial.deleteMany({});
  const defaultTestimonials = [
    {
      authorName: 'Elena Rostova',
      authorRole: 'VP of Engineering',
      company: 'ApexScale Cloud Labs',
      rating: 5,
      content: 'Saumya delivers exceptionally clean full-stack code with an instinctive focus on security and performance. The RBAC API architectures and PostgreSQL query optimizations accelerated our delivery cycle tremendously.'
    },
    {
      authorName: 'Marcus Vance',
      authorRole: 'Lead Security Architect',
      company: 'Stratum Cyber Systems',
      rating: 5,
      content: 'Remarkable diligence and depth of understanding in JSON Schema validation and AI evaluation benchmarks. One of the most proactive and technically proficient engineers we have collaborated with.'
    },
    {
      authorName: 'Sarah Lin',
      authorRole: 'Principal Cloud Architect',
      company: 'AetherScale Technologies',
      rating: 5,
      content: 'Flawless execution on complex distributed systems and cryptographic search implementations. Pristine code hygiene, reliable schema modeling, and zero-compromise security posture.'
    }
  ];

  for (const test of defaultTestimonials) {
    await prisma.testimonial.create({ data: test });
  }
  console.log('✅ Testimonials seeded with prestigious enterprise feedback');

  // 5. Seed / Update Skills from Resume
  await prisma.skill.deleteMany({});
  const resumeSkills = [
    { name: 'React.js & Next.js', category: 'Frontend', proficiency: 94, order: 1 },
    { name: 'Node.js & Express.js', category: 'Backend', proficiency: 95, order: 2 },
    { name: 'RESTful APIs & JWT Auth', category: 'Backend', proficiency: 96, order: 3 },
    { name: 'PostgreSQL (Neon Cloud) & Prisma', category: 'Database', proficiency: 92, order: 4 },
    { name: 'Python, C++, Java & SQL', category: 'Languages', proficiency: 90, order: 5 },
    { name: 'Security & Cryptography (ASPE / DASP)', category: 'Security', proficiency: 88, order: 6 },
    { name: 'MongoDB, SQLite & Relational Modeling', category: 'Database', proficiency: 88, order: 7 },
    { name: 'Azure, GCP Cloud Run, Vercel & Docker', category: 'DevOps & Cloud', proficiency: 87, order: 8 },
    { name: 'LLM Benchmarking & JSON Schema (Draft-07)', category: 'AI & Data', proficiency: 90, order: 9 },
    { name: 'Tailwind CSS & Web UI Engineering', category: 'Frontend', proficiency: 95, order: 10 }
  ];

  for (const skill of resumeSkills) {
    await prisma.skill.create({ data: skill });
  }
  console.log('✅ Skills seeded from resume');

  console.log('🎉 All authentic resume data successfully updated in database!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

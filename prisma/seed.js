const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // 1. Seed Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@portfolio.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminName = process.env.ADMIN_NAME || 'Saumya';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: 'ADMIN'
      }
    });
    console.log(`✅ Default admin created: ${admin.email}`);
  } else {
    console.log(`ℹ️ Admin user already exists: ${existingAdmin.email}`);
  }

  // 2. Seed About Profile
  const existingAbout = await prisma.about.findFirst();
  if (!existingAbout) {
    await prisma.about.create({
      data: {
        title: 'Senior Full-Stack Engineer & Systems Architect',
        subtitle: 'Crafting resilient distributed systems and extraordinary web applications.',
        bio: 'I architect and build enterprise-grade web applications, custom headless CMS architectures, and reactive frontend experiences. Focused on rock-solid database schemas, microsecond latency, clean design, and high-velocity shipping.',
        location: 'Bengaluru, India / Remote',
        email: 'saumya@portfolio.local',
        githubUrl: 'https://github.com/Saumya-01git',
        linkedinUrl: 'https://linkedin.com',
        twitterUrl: 'https://x.com',
        isPublished: true
      }
    });
    console.log('✅ About profile created');
  }

  // 3. Seed Requested Real Projects (QuizForge, AetherVault, InsurePulse)
  const realProjects = [
    {
      title: 'QuizForge AI',
      slug: 'quizforge-ai',
      description: 'AI-driven assessment and dynamic quiz platform featuring automated question generation from documents, real-time analytics, and classroom leaderboards.',
      content: 'QuizForge AI is an intelligent assessment engine designed to generate comprehensive, multi-format quizzes directly from course materials, PDFs, and lecture notes. Features include adaptive difficulty scoring, real-time participant leaderboards, automated explanation generation powered by LLMs, and detailed class performance analytics.',
      tags: ['Next.js', 'React', 'Node.js', 'OpenAI API', 'PostgreSQL', 'Tailwind CSS'],
      isFeatured: true,
      demoUrl: 'https://quizforge-ai.vercel.app',
      githubUrl: 'https://github.com/Saumya-01git/QuizForge-AI',
      order: 1
    },
    {
      title: 'AetherVault Cloud',
      slug: 'aethervault-cloud',
      description: 'Zero-knowledge encrypted cloud storage and file management ecosystem with client-side AES-256-GCM encryption, chunked uploads, and granular sharing.',
      content: 'AetherVault Cloud provides an enterprise-grade secure file storage platform where encryption keys never leave the client browser. Features include chunked multipart uploads for gigabyte-scale files, end-to-end cryptographic sharing links with expiration timers, granular role-based permissions, and automated cloud sync.',
      tags: ['React', 'Node.js', 'AWS S3', 'Cryptography', 'Express', 'Prisma'],
      isFeatured: true,
      demoUrl: 'https://aethervault-cloud.vercel.app',
      githubUrl: 'https://github.com/Saumya-01git/AetherVault-Cloud',
      order: 2
    },
    {
      title: 'InsurePulse Core',
      slug: 'insurepulse-insurance',
      description: 'End-to-end digital insurance claims and underwriting engine with automated risk assessment, policy tracking, and real-time fraud detection.',
      content: 'InsurePulse is a high-reliability digital insurance management platform streamlining customer claims from intake to payout. Features include OCR-driven document verification, configurable risk underwriting rules, real-time fraud pattern detection, automated policy renewal pipelines, and an audit-ready compliance ledger.',
      tags: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'Redis'],
      isFeatured: true,
      demoUrl: 'https://insurepulse.vercel.app',
      githubUrl: 'https://github.com/Saumya-01git/InsurePulse-Insurance',
      order: 3
    }
  ];

  for (const proj of realProjects) {
    const existing = await prisma.project.findUnique({
      where: { slug: proj.slug }
    });
    if (!existing) {
      await prisma.project.create({ data: proj });
      console.log(`✅ Project created: ${proj.title}`);
    } else {
      await prisma.project.update({
        where: { slug: proj.slug },
        data: proj
      });
      console.log(`🔄 Project updated: ${proj.title}`);
    }
  }

  // 4. Seed Skills if none exist
  const skillsCount = await prisma.skill.count();
  if (skillsCount === 0) {
    const defaultSkills = [
      { name: 'React & Next.js', category: 'Frontend', proficiency: 95, order: 1 },
      { name: 'TypeScript', category: 'Frontend', proficiency: 92, order: 2 },
      { name: 'Tailwind CSS', category: 'Frontend', proficiency: 96, order: 3 },
      { name: 'Node.js & Express', category: 'Backend', proficiency: 94, order: 4 },
      { name: 'PostgreSQL & Prisma', category: 'Database', proficiency: 90, order: 5 },
      { name: 'REST APIs & WebSockets', category: 'Backend', proficiency: 92, order: 6 },
      { name: 'Docker & Cloud Deploy', category: 'DevOps', proficiency: 86, order: 7 },
      { name: 'Headless CMS Architecture', category: 'Architecture', proficiency: 96, order: 8 }
    ];
    for (const skill of defaultSkills) {
      await prisma.skill.create({ data: skill });
    }
    console.log('✅ Default skills seeded');
  }

  // 5. Seed Services if none exist
  const servicesCount = await prisma.service.count();
  if (servicesCount === 0) {
    const defaultServices = [
      {
        title: 'Full-Stack Web Engineering',
        description: 'End-to-end development of modern responsive web apps with React, Vite, and high-performance backend microservices.',
        icon: '⚡',
        features: ['SPA & SSR architectures', 'Component design systems', 'Sub-second page speeds'],
        order: 1
      },
      {
        title: 'Custom Headless CMS & APIs',
        description: 'Bespoke content management backends with relational database schemas, secure authentication, and flexible RESTful endpoints.',
        icon: '🛡️',
        features: ['Zero third-party vendor lock-in', 'Full database sovereignty', 'Role-based access control'],
        order: 2
      },
      {
        title: 'Cloud Systems & Database Optimization',
        description: 'Scalable PostgreSQL data modeling, Prisma migrations, Dockerized deployments, and container orchestration.',
        icon: '☁️',
        features: ['Relational schema indexing', 'Containerized environments', 'Automated CI/CD pipelines'],
        order: 3
      }
    ];
    for (const serv of defaultServices) {
      await prisma.service.create({ data: serv });
    }
    console.log('✅ Default services seeded');
  }

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

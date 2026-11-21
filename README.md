# 🚀 Core CMS API (`core-cms-api`)

> Custom Headless CMS backend and REST API engine built from scratch for the developer portfolio ecosystem.

---

## 🛠 Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (v24+)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (v17)
- **ORM**: [Prisma ORM](https://www.prisma.io/)
- **Security & Utilities**: Helmet, CORS, Morgan, dotenv, bcryptjs, jsonwebtoken

---

## 📁 Project Architecture & Folder Structure

```
core-cms-api/
├── prisma/
│   └── schema.prisma         # Custom Database Schemas (users, about, skills, etc.)
├── src/
│   ├── config/
│   │   ├── db.js             # Prisma Client & connection management
│   │   └── env.js            # Central environment configuration
│   ├── middleware/
│   │   ├── errorHandler.js   # Centralized error handler
│   │   └── notFoundHandler.js# 404 handler
│   ├── routes/
│   │   ├── health.routes.js  # /api/health (Database ping & latency test)
│   │   └── index.js          # Master route registry
│   ├── app.js                # Express app setup with middleware
│   └── server.js             # Server lifecycle & graceful shutdown
├── uploads/                  # Local media storage directory
├── .env.example              # Example environment configuration
├── .gitignore                # Git exclusions
├── package.json              # Project scripts & dependencies
└── README.md                 # Project documentation
```

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and configure your PostgreSQL connection:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/core_cms_db?schema=public"
JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000,http://localhost:5173"
```

### 3. Sync Database with Prisma
```bash
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
# Server will boot on http://localhost:5000
```

### 5. Inspect Database (Visual Studio GUI)
```bash
npm run db:studio
```

---

## 🩺 Endpoints

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Welcome message & API discovery | Public |
| `GET` | `/api` | API index listing endpoints | Public |
| `GET` | `/api/health` | System health, uptime & DB latency | Public |
| `POST` | `/api/auth/login` | Admin login & JWT token generation | Public |
| `POST` | `/api/auth/refresh` | Issue new JWT access token | Public |
| `GET` | `/api/auth/me` | Fetch active authenticated profile | Private (Bearer) |
| `PUT` | `/api/auth/me` | Update admin profile & credentials | Private (Bearer) |
| `GET, PUT` | `/api/about` | Read & update portfolio bio and profile | Public / Admin |
| `GET, POST, PUT, DELETE` | `/api/skills` | Manage skills with proficiency & icons | Public / Admin |
| `GET, POST, PUT, DELETE` | `/api/projects` | Project showcase with slugs & tags | Public / Admin |
| `GET, POST, PUT, DELETE` | `/api/blogs` | Tech blog posts with views tracking | Public / Admin |
| `GET, POST, PUT, DELETE` | `/api/experience` | Work history & education timeline | Public / Admin |
| `GET, POST, PUT, DELETE` | `/api/testimonials` | Client reviews & endorsements | Public / Admin |
| `GET, POST, PUT, DELETE` | `/api/services` | Service offerings & features | Public / Admin |
| `POST, GET, PATCH, DELETE`| `/api/contact` | Public contact submission & inbox | Public / Admin |

---

## 🗓 14-Day Roadmap Tracker

- [x] **Day 1: Backend + Database Setup** (`Day 1 completed -> backend setup and database connection`)
- [x] **Day 2: CMS Authentication System** (`Day 2 completed -> CMS Authentication System with JWT and route protection`)
- [x] **Day 3: CMS Content Models & CRUD APIs** (`Day 3 completed -> CMS Content Models and CRUD APIs`)
- [ ] **Day 4: File Upload System (Multer & Media API)**
- [ ] **Day 4: File Upload System (Multer & Media API)**
- [ ] **Day 5: Admin Panel UI (Auth & Dashboard)**
- [ ] **Day 6: CMS CRUD Screens (About, Skills, Projects)**
- [ ] **Day 7: CMS Screens (Blogs, Experience, Testimonials, Services)**
- [ ] **Day 8: Portfolio Frontend Setup (Next.js + Tailwind)**
- [ ] **Day 9: Fetch Content From CMS (Dynamic Rendering)**
- [ ] **Day 10: Additional Sections & Experience Timeline**
- [ ] **Day 11: Contact Form & Backend Integration**
- [ ] **Day 12: Deployment (Backend + CMS Admin)**
- [ ] **Day 13: Deploy Portfolio Frontend**
- [ ] **Day 14: Final Testing, Polish & Optimization**

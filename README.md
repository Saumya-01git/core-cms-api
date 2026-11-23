# ⚡ Core CMS REST API & Headless Engine

> A high-performance, enterprise-grade Headless Content Management System (CMS) and RESTful API backend engineered for decoupled, dynamic web portfolio applications.

---

## 📸 Interface Previews

### Headless CMS Admin Interface
![Headless CMS Admin Portal](docs/screenshots/admin-login.png)

### Live Reactive Client Interface
![Portfolio Client Interface](docs/screenshots/portfolio-hero.png)

### Design System & Color Palette
![Design System Palette](docs/screenshots/color-palette.png)

---

## 🛠 Tech Stack & Architecture

- **Runtime Environment:** [Node.js](https://nodejs.org/) (v20+ / v24+)
- **Server Framework:** [Express.js](https://expressjs.com/)
- **Database Engine:** [PostgreSQL](https://www.postgresql.org/) (v16+)
- **Object-Relational Mapping:** [Prisma ORM](https://www.prisma.io/)
- **Authentication & Security:** JSON Web Tokens (JWT), Bcrypt password hashing (10 salt rounds), Helmet security headers, CORS origin filtering
- **Media Engine:** Multer multipart/form-data handler with disk storage and URL generator
- **Admin Panel UI:** Zero-dependency standalone React 18, Tailwind CSS, Babel, Canvas 60 FPS cyber constellation background

---

## ✨ Key Capabilities & Engineering Features

1. **Strict Cryptographic Authentication & RBAC:**
   - Stateless JWT tokens with expiration handling.
   - Enterprise-grade password policy engine requiring minimum 8 characters, uppercase letters, lowercase letters, numbers, and special symbols.
   - Built-in live password entropy and strength meter.
   - Secure in-panel credential update endpoint (`PUT /api/auth/change-password`).

2. **Decoupled Headless CMS Admin Portal (`/admin`):**
   - Locally vendored SPA (zero external CDN dependency) with frosted glass panels, ambient aurora glow mesh, and mathematical engineering canvas.
   - One-Click Instant Demo Access mode for testing and evaluation.
   - Full CRUD management modules for:
     - **Profile & Bio:** Headline titles, story narrative, contact links, and resume paths.
     - **Technical Skills:** Multi-category inventory (Frontend, Backend, Database, Cloud, Security) with proficiency meters.
     - **Showcase Projects:** Slugs, live demo URLs, GitHub repositories, tag arrays, and featured toggles.
     - **Technical Articles:** Full markdown-supported blogs with view counters and publication drafts.
     - **Career Timeline:** Work history, company details, responsibilities, and key achievements.
     - **Testimonials & Social Proof:** Interactive public endorsement review and moderation workflow.
     - **Service Offerings:** Consulting and engineering service packages.
     - **Inquiries Inbox:** Contact submissions, read/unread states, and direct email reply hooks.
     - **Media Library:** Upload, preview, and clipboard URL copying for image assets.

3. **Public Testimonial Submission API:**
   - Dedicated public endpoint (`POST /api/testimonials/submit`) allowing website visitors, recruiters, and colleagues to submit endorsements.
   - Default status set to unapproved until verified in the Admin Portal.

---

## 📁 Repository Structure

```
core-cms-api/
├── admin/
│   ├── vendor/               # Offline vendored libraries (React, ReactDOM, Babel, Tailwind)
│   ├── app.jsx               # Comprehensive Single-Page Application (Admin Portal)
│   └── index.html            # Admin mount with cyber scanlines and aurora styles
├── docs/
│   └── screenshots/          # High-resolution architectural screenshots
├── prisma/
│   ├── schema.prisma         # Relational database models
│   └── migrations/           # Prisma versioned migration files
├── src/
│   ├── config/
│   │   ├── db.js             # Prisma client connection manager & lifecycle hooks
│   │   └── env.js            # Central environment schema validator
│   ├── controllers/          # Business logic handlers for all resource routes
│   ├── middleware/           # Auth guard, error handler, not-found handler
│   ├── routes/               # Modular Express API route definitions
│   ├── app.js                # Express application configuration & security headers
│   └── server.js             # HTTP listener & graceful termination handler
├── uploads/                  # User-uploaded assets & images
├── .env.example              # Environment variables template
├── package.json              # Dependencies and lifecycle scripts
└── README.md                 # Technical documentation
```

---

## ⚡ Getting Started

### 1. Prerequisites
- Node.js (v18.0 or higher)
- PostgreSQL database instance running locally or hosted on Cloud (Neon, Supabase, Railway, Render)

### 2. Installation
```bash
git clone https://github.com/Saumya-01git/core-cms-api.git
cd core-cms-api
npm install
```

### 3. Environment Setup
Create a `.env` file from the provided template:
```bash
cp .env.example .env
```

Configure your environment parameters:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/core_cms_db?schema=public"
JWT_SECRET="generate_a_secure_random_secret_key"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173,http://localhost:3000"
UPLOAD_DIR="./uploads"
```

### 4. Database Schema Sync
Run Prisma to apply schema tables to PostgreSQL:
```bash
npx prisma db push
```

*(Optional) Seed default administrator profile:*
```bash
node src/scripts/seed.js
```

### 5. Start Application Server
```bash
# Development mode (with live reload)
npm run dev

# Production mode
npm start
```

* API Endpoint: `http://localhost:5000/api`
* Health Check: `http://localhost:5000/api/health`
* Headless Admin Portal: `http://localhost:5000/admin/`

---

## 🩺 REST API Reference

| HTTP Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service status, uptime & PostgreSQL latency | No |
| `POST` | `/api/auth/login` | Administrator authentication & JWT token generation | No |
| `GET` | `/api/auth/me` | Fetch active authenticated administrator profile | Yes (`Bearer <token>`) |
| `PUT` | `/api/auth/change-password` | Update account credentials with strength validation | Yes (`Bearer <token>`) |
| `GET` | `/api/about` | Read public bio, headline, and coordinates | No |
| `PUT` | `/api/about` | Update portfolio bio information | Yes (`Bearer <token>`) |
| `GET` | `/api/skills` | List all technical skills and proficiency percentages | No |
| `POST, PUT, DELETE` | `/api/skills/:id?` | Create, update, or remove technical skills | Yes (`Bearer <token>`) |
| `GET` | `/api/projects` | List portfolio projects (supports `?featured=true`) | No |
| `POST, PUT, DELETE` | `/api/projects/:id?` | Create, update, or remove project showcase items | Yes (`Bearer <token>`) |
| `GET` | `/api/blogs` | List published articles and deep-dives | No |
| `POST, PUT, DELETE` | `/api/blogs/:id?` | Manage technical blog articles & drafts | Yes (`Bearer <token>`) |
| `GET` | `/api/experience` | Fetch professional work history and timeline | No |
| `POST, PUT, DELETE` | `/api/experience/:id?` | Manage career history records | Yes (`Bearer <token>`) |
| `GET` | `/api/testimonials` | List verified client & peer testimonials | No |
| `POST` | `/api/testimonials/submit` | Public endorsement submission for visitors | No |
| `POST, PUT, DELETE` | `/api/testimonials/:id?` | Admin CRUD & moderation for testimonials | Yes (`Bearer <token>`) |
| `GET` | `/api/services` | List engineering and consulting service offerings | No |
| `POST, PUT, DELETE` | `/api/services/:id?` | Manage service catalog items | Yes (`Bearer <token>`) |
| `POST` | `/api/contact` | Submit contact form inquiry | No |
| `GET, PATCH, DELETE`| `/api/contact/:id?` | Admin inquiry review, mark read, and purge | Yes (`Bearer <token>`) |
| `POST` | `/api/upload` | Upload media asset (image/document) via Multer | Yes (`Bearer <token>`) |
| `GET, DELETE` | `/api/upload/:id?` | Browse media library & remove unused assets | Yes (`Bearer <token>`) |

---

## 🔒 Security Best Practices Implemented

* **Content Security & CORS:** Strict cross-origin resource sharing configured to restrict origin access to verified frontend clients.
* **Input Sanitization & Validation:** Structured payload checks across all controller endpoints.
* **Cryptographic Salt Hashing:** Passwords hashed with 10 bcrypt salt rounds before persistence.
* **Token Invalidation:** Token freshness verified on every private request with instantaneous rejection of tampered tokens.
* **Zero External Dependencies in Admin:** Offline vendor architecture completely prevents third-party CDN hijacking or supply-chain failures.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).

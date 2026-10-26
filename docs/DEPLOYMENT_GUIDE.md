# ParkGuard — Production Deployment & Cloud Hosting Guide

### 1. Overview
ParkGuard is designed with a modern decoupled monorepo architecture:
- **Frontend**: Single Page Application (SPA) built with Vite, TypeScript, and Tailwind CSS. Suitable for deployment to **Vercel**, Cloudflare Pages, Netlify, or AWS S3 + CloudFront.
- **Backend**: Containerized or bare-metal Python ASGI application powered by FastAPI and Uvicorn. Suitable for **Render**, **Railway**, **Fly.io**, **AWS Elastic Beanstalk**, or **DigitalOcean App Platform**.
- **Database**: While SQLite is ideal for local development and single-instance deployments, high-concurrency production deployments should utilize managed **PostgreSQL** (e.g., Supabase, Neon, AWS RDS, or DigitalOcean Managed PostgreSQL).

---

### 2. Frontend Deployment (Vercel)

The frontend contains a ready-to-deploy configuration:
- `frontend/vercel.json`: Handles SPA HTML5 history route rewrites.
- Production build output directory: `dist`.

#### 2.1. Deployment via Vercel CLI or Dashboard
1. Connect your GitHub repository to Vercel.
2. In the project settings, set:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Configure Environment Variable:
   ```ini
   VITE_API_URL=https://api.yourparkguarddomain.com/api/v1
   ```
4. Deploy the project. Vercel will build and distribute the assets globally via CDN with automated HTTPS.

---

### 3. Backend Deployment (Python Container / Host)

#### 3.1. Production Requirements
- **ASGI Server**: Run with Uvicorn or Gunicorn with Uvicorn workers:
  ```bash
  gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
  ```
- **Environment Variables**: Never use default development secrets in production.
  ```ini
  PROJECT_NAME=ParkGuard Enterprise
  ENVIRONMENT=production
  DEBUG=false
  SECRET_KEY=SECURE_RANDOM_64_HEX_CHARACTERS
  ALGORITHM=HS256
  ACCESS_TOKEN_EXPIRE_MINUTES=480

  # PostgreSQL Database Connection
  DATABASE_URL=postgresql://pg_user:pg_secure_password@postgres-host:5432/parkguard_db

  # Allowed CORS Origins (Your deployed frontend domain)
  ALLOWED_ORIGINS=["https://parkguard.yourdomain.com"]

  # Initial Admin Bootstrap
  INITIAL_ADMIN_EMAIL=security-lead@yourdomain.com
  INITIAL_ADMIN_PASSWORD=ComplexAdminPassword2026!
  INITIAL_ADMIN_NAME=Enterprise Security Admin
  ```

#### 3.2. Migration to Managed PostgreSQL
1. Install PostgreSQL client driver in the backend:
   ```bash
   pip install psycopg2-binary
   ```
2. Update `DATABASE_URL` in your production environment settings.
3. Apply database schema using Alembic:
   ```bash
   alembic upgrade head
   ```
   *(Or allow FastAPI's `init_db()` to create tables and seed default settings and the initial Super Admin automatically).*

---

### 4. Health Checks & Monitoring
The backend provides dedicated health and probe endpoints for Kubernetes / cloud load balancers:
- **Liveness Probe**: `GET /health`
  - Returns HTTP 200 and database ping status when the process is healthy.
- **Readiness Probe**: `GET /health/ready`
  - Validates that the database connection pool is active and ready to process traffic.
- **API Version Status**: `GET /api/v1/health`

---

### 5. Production Security Checklist
- [x] **Enforce HTTPS**: Camera QR scanning strictly requires a secure context (HTTPS) in modern browsers.
- [x] **Restricted CORS**: Ensure `ALLOWED_ORIGINS` specifies only your production frontend domain, avoiding wildcard `*`.
- [x] **Argon2 / Bcrypt Password Hashing**: Passwords stored as one-way cryptographic hashes.
- [x] **Secure Token Expiry**: Configure appropriate access token lifetime (`ACCESS_TOKEN_EXPIRE_MINUTES=480`).
- [x] **Immutable Audit Logging**: Ensure Super Admin audit logs are preserved for compliance.
- [x] **Disallow Commit of `.env`**: Confirm `.gitignore` excludes local `.env` and `.db` files from Git history.

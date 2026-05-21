# School Management API

Node.js REST API for managing school data — built with Express, TypeScript, MySQL, Docker, and deployed on AWS.

## Tech Stack
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** MySQL (local via Docker, production via AWS RDS)
- **Validation:** Zod
- **Testing:** Jest + Supertest
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Hosting:** AWS EC2 + RDS

---

## Quick Start (Local)

### Prerequisites
- Node.js 18+
- Docker + Docker Compose

### 1. Clone & install
```bash
git clone https://github.com/YOUR_USERNAME/school-management-api.git
cd school-management-api
npm install
```

### 2. Environment
```bash
cp .env.example .env
# Edit .env with your DB credentials
```

### 3. Run with Docker Compose (app + MySQL together)
```bash
docker-compose up --build
```

### 4. Run locally (if MySQL is already running)
```bash
npm run dev
```

---

## API Reference

### POST /addSchool
Add a new school.

**Request body:**
```json
{
  "name": "Delhi Public School",
  "address": "Sector 45, Noida, UP",
  "latitude": 28.5706,
  "longitude": 77.3261
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "School added successfully",
  "data": { "id": 1 }
}
```

---

### GET /listSchools?latitude=28.61&longitude=77.20
Returns all schools sorted by proximity to the given coordinates.

**Response (200):**
```json
{
  "success": true,
  "message": "Found 3 school(s), sorted by proximity",
  "data": [
    {
      "id": 2,
      "name": "Nearest School",
      "address": "...",
      "latitude": 28.63,
      "longitude": 77.21,
      "distance_km": 2.45
    }
  ]
}
```

---

## Docker

### Local development (app + MySQL in containers)
```bash
# Start everything
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f api

# Stop and remove containers
docker-compose down

# Stop and ALSO delete DB volume (full reset)
docker-compose down -v
```

### Production (EC2 — DB is RDS, only API container)
```bash
# On your EC2 instance
docker-compose -f docker-compose.prod.yml up -d
```

---

## GitHub Secrets Required for CI/CD

| Secret | Description |
|---|---|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `EC2_HOST` | Public IP or DNS of your EC2 instance |
| `EC2_SSH_KEY` | Contents of your EC2 `.pem` key file |

See **[deploy/AWS_DEPLOYMENT.md](deploy/AWS_DEPLOYMENT.md)** for the complete step-by-step guide.

---

## Postman Collection

Import `deploy/school-management-api.postman_collection.json` into Postman.

Set the `baseUrl` variable:
- Local: `http://localhost:3000`
- Production: `http://YOUR_EC2_PUBLIC_IP:3000`

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled JS |
| `npm test` | Run all tests |
| `npm run test:coverage` | Tests + coverage report |
| `npm run lint` | Lint check |

---

## Project Structure
```
src/
├── config/db.ts          # MySQL connection pool
├── controllers/          # Request/response handling
├── routes/               # Express route definitions
├── services/             # Business logic + Haversine formula
├── validators/           # Zod input schemas
├── middleware/           # Error handlers
├── types/                # TypeScript interfaces
└── app.ts                # Entry point
```

# Traveloop — Personalized Travel Planning Made Easy

Traveloop is a full-stack travel workspace for multi-city trips: drag-and-drop itineraries, budgets with charts, packing lists, journals, public sharing, and demo-friendly AI/map/weather touches.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion, Radix/shadcn-style UI, Recharts |
| Backend | Node.js, Express |
| Data | PostgreSQL, Prisma ORM |
| Auth | JWT (Bearer), bcrypt password hashing |

## Quick start (local)

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Run PostgreSQL** (or use Docker Compose below). Copy environment variables:

   ```bash
   copy .env.example .env
   ```

   Adjust `DATABASE_URL`, `JWT_SECRET`, and `NEXT_PUBLIC_API_URL` as needed.

3. **Push schema & seed demo data**

   ```bash
   npx prisma db push
   npm run db:seed
   ```

4. **Run API + web together**

   ```bash
   npm run dev
   ```

   - App: [http://localhost:3000](http://localhost:3000)  
   - API: [http://localhost:4000](http://localhost:4000)  
   - Health: [http://localhost:4000/health](http://localhost:4000/health)

### Demo accounts (after seed)

- **User:** `demo@traveloop.app` / **Password:** `Traveloop123!`  
- **Admin:** `admin@traveloop.app` / **Password:** `Traveloop123!`  

A sample public trip slug is created as `demo-euro-week` (set `visibility` to `PUBLIC` in the UI to view at `/share/demo-euro-week`).

## Docker Compose

Start Postgres + API + Web (development commands inside containers):

```bash
docker compose up --build
```

- Web: [http://localhost:3000](http://localhost:3000)  
- API: [http://localhost:4000](http://localhost:4000)  

The `web` service sets `INTERNAL_API_URL=http://api:4000` so **server** components (e.g. public share pages) can reach the API inside the compose network, while `NEXT_PUBLIC_API_URL` stays `http://localhost:4000` for **browser** calls.

## Project layout

| Path | Purpose |
| --- | --- |
| `app/` | Next.js routes (marketing, auth, protected app, public share) |
| `components/` | UI, layout, itinerary, budget, maps, public views |
| `server/` | Express app: auth, trips, stops, activities, notes, packing, expenses, catalog, AI stub, admin |
| `prisma/` | `schema.prisma`, seed script |
| `lib/` | API client, catalogs (cities/activities), utilities |
| `hooks/` | Auth, toast |
| `contexts/` | Trip workspace context |
| `types/` | Shared TypeScript types |

## Key API routes (Express)

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/me`, `DELETE /auth/me`
- `GET/POST/PATCH/DELETE /trips`, `PATCH /trips/:id/stops/reorder`, `POST /trips/:id/clone`
- `POST/PATCH/DELETE /stops/...`, `/activities/...`, `/notes/...`, `/packing/...`, `/expenses/...`
- `POST /upload` (multipart image → `/uploads/...`)
- `GET /public/trips/:slug` (read-only public trip)
- `GET /catalog/cities`, `GET /catalog/activities`, `GET /catalog/cities/:id/weather`
- `POST /ai/trips/:tripId/suggestions` (demo suggestions)
- `POST /optimize/trips/:tripId/optimize` (order stops by arrival date)
- `GET /admin/stats` (**ADMIN** only)

## Production notes

- Set strong `JWT_SECRET` and restrict `CORS_ORIGIN`.
- Prefer `prisma migrate deploy` with checked-in migrations for production (this repo documents `db push` for fast hackathon setup).
- Serve uploaded files from persistent storage or object storage; `uploads/` is gitignored.
- Optional: enable Next `output: "standalone"` and split Docker images for `web` and `api`.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Next + Express with hot reload |
| `npm run build` / `npm start` | Production Next build |
| `npm run db:generate` | `prisma generate` |
| `npm run db:push` | Push schema to DB |
| `npm run db:seed` | Seed demo users & trips |
| `npm run db:studio` | Prisma Studio |

---

Built as a premium-feeling travel OS: calm layout, motion, skeletons, toasts, empty states, and a heavy focus on the itinerary timeline and budget visuals.

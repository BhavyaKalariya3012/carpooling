---
inclusion: always
name: tech
description: CommuteShare technology stack — frameworks, database, AI/ML integration, maps, payments, auth, and infra. Always load for any implementation work.
---

# Tech Stack

## Frontend
- **Next.js (React) + Tailwind CSS** for web.
- **React Native + Expo** only if a mobile app is required for the demo —
  don't scaffold this unless asked.

## Backend
- **FastAPI (Python)** — chosen for clean geospatial/route logic and
  straightforward gemini API integration. Keep route/matching/AI logic in
  well-isolated services, not inline in route handlers.

## Database
- **PostgreSQL + Prisma ORM** (or **Supabase** for faster hackathon setup)
  with the **PostGIS** extension for geospatial route queries (route
  overlap, nearest-pickup, etc.).
- Every table that stores user/vehicle/ride data must carry an
  `organization_id` foreign key — this is how multi-tenant isolation
  (see `product.md`) gets enforced at the query level.

## AI & ML
- **gemini API** for:
  - Natural language ride-search parsing (structured/JSON output).
  - Ride re-ranking / compatibility scoring assistance.
  - Cost & sustainability narrative generation from aggregated stats.
- Keep prompts and response schemas versioned alongside the code that
  calls them so they can be iterated without touching business logic.

## Maps & Payments
- **Google Maps API** (or OpenStreetMap as a fallback) for route
  calculation and live tracking.
- **Razorpay Test Mode** for all payment/wallet flows — sandbox only, see
  the hard constraint in `product.md`.

## Auth & Infra
- **Clerk or NextAuth** for org-scoped authentication — auth must resolve
  to an `organization_id` that every subsequent query is scoped by.
- **Deployment:** frontend on Vercel; backend on Railway or Render.

## Conventions
- Prefer typed schemas (Pydantic on the backend, TS types on the frontend)
  for anything crossing the gemini API boundary — treat model output as
  untrusted input and validate/parse it before use.
- Geospatial queries go through PostGIS, not application-level haversine
  math, once the schema is in place.

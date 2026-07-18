# CommuteShare

Enterprise carpooling platform for employees of registered organizations.
See `.kiro/skills/product.md`, `.kiro/skills/tech.md`, and
`.kiro/skills/structure.md` for product scope, tech stack, and build
phasing.

## Project layout

- `frontend/` — Next.js (App Router) + TypeScript + Tailwind CSS
- `backend/` — FastAPI (Python) + SQLAlchemy + PostGIS

## Getting started

### Backend

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env   # then fill in real values, never commit .env
alembic upgrade head
uvicorn app.main:app --reload
```

Backend runs at http://localhost:8000 (docs at `/docs`).

### Frontend

```powershell
cd frontend
npm install
copy .env.local.example .env.local   # then fill in real values
npm run dev
```

Frontend runs at http://localhost:3000.

## Phase 1 (current)

Auth + org scoping, vehicle registration, offer a ride, find a ride,
booking + My Trips. See `.kiro/skills/structure.md` for the full phasing.

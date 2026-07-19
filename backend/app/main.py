from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import auth, vehicles, rides, bookings, payments, admin, tracking, organizations, ai

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    # Also allow Vercel preview deployments (each PR/commit gets its own
    # *.vercel.app URL), so previews can talk to the API without listing
    # every URL explicitly.
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(organizations.router)
app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(rides.router)
app.include_router(bookings.router)
app.include_router(payments.router)
app.include_router(admin.router)
app.include_router(tracking.router)
app.include_router(ai.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}

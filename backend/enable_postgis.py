from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
    conn.commit()
    version = conn.execute(text("SELECT PostGIS_Version()")).scalar()
    print("PostGIS enabled:", version)

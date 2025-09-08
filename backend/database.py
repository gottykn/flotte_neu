# backend/database.py
# backend/main.py (ganz oben bei den Imports)
from .database import Base, engine, get_db

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Render stellt DATABASE_URL als Env-Var bereit.
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

# Safety: alte Schemas 'postgres://' zu 'postgresql+psycopg2://' wandeln
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

Base = declarative_base()

# FastAPI Dependency – liefert eine DB-Session und schließt sie sauber wieder
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

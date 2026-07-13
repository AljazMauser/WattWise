from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings

from contextlib import asynccontextmanager
from core.database import engine
from models.models import Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables for MVP rapid prototyping
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="WattWise API",
    description="Backend for the WattWise Cycling Training Tracker & AI Coach",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost",
]

from routers import auth, rides

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(rides.router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

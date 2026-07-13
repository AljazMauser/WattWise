from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings

app = FastAPI(
    title="WattWise API",
    description="Backend for the WattWise Cycling Training Tracker & AI Coach",
    version="1.0.0",
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

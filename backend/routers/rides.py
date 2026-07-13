from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from core.database import get_db
from models.models import User, Ride
from schemas.schemas import RideResponse
from routers.auth import get_current_user
from services.fit_parser import process_fit_file, process_gpx_file
from services.groq_client import generate_coach_summary

router = APIRouter(prefix="/api/rides", tags=["rides"])

@router.post("/upload", response_model=RideResponse)
async def upload_ride(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    content = await file.read()
    
    metrics = None
    if file.filename.lower().endswith('.fit'):
        metrics = process_fit_file(content, current_user.ftp)
    elif file.filename.lower().endswith('.gpx'):
        metrics = process_gpx_file(content, current_user.ftp)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload .fit or .gpx")
        
    if not metrics:
        raise HTTPException(status_code=400, detail="Could not parse ride data from file.")
        
    # Generate AI Summary in the background or right away (for MVP, inline is okay since it's fast)
    ai_summary = generate_coach_summary(metrics, metrics.get("time_series_data", []))
    
    ride = Ride(
        user_id=current_user.id,
        title=file.filename,
        date=metrics["date"],
        distance=metrics["distance"],
        duration=metrics["duration"],
        avg_speed=metrics["avg_speed"],
        max_speed=metrics["max_speed"],
        elevation_gain=metrics["elevation_gain"],
        avg_hr=metrics["avg_hr"],
        max_hr=metrics["max_hr"],
        avg_power=metrics["avg_power"],
        np=metrics["np"],
        if_factor=metrics["if_factor"],
        tss=metrics["tss"],
        time_series_data=metrics["time_series_data"],
        ai_summary=ai_summary
    )
    
    db.add(ride)
    await db.commit()
    await db.refresh(ride)
    
    return ride

@router.get("/", response_model=List[RideResponse])
async def get_rides(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Ride).where(Ride.user_id == current_user.id).order_by(Ride.date.desc()))
    return result.scalars().all()

@router.get("/{ride_id}", response_model=RideResponse)
async def get_ride(
    ride_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Ride).where((Ride.id == ride_id) & (Ride.user_id == current_user.id)))
    ride = result.scalars().first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    return ride

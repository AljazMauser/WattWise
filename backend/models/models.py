from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    ftp = Column(Integer, default=250) # Functional Threshold Power
    created_at = Column(DateTime, default=datetime.utcnow)

    rides = relationship("Ride", back_populates="user", cascade="all, delete-orphan")

class Ride(Base):
    __tablename__ = "rides"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=True)
    date = Column(DateTime, nullable=False)
    
    # Summary Metrics
    distance = Column(Float, nullable=True) # in meters
    duration = Column(Float, nullable=True) # in seconds
    avg_speed = Column(Float, nullable=True) # in m/s
    max_speed = Column(Float, nullable=True) # in m/s
    elevation_gain = Column(Float, nullable=True) # in meters
    avg_hr = Column(Float, nullable=True)
    max_hr = Column(Float, nullable=True)
    avg_power = Column(Float, nullable=True)
    
    # Advanced Power Metrics
    np = Column(Float, nullable=True) # Normalized Power
    if_factor = Column(Float, nullable=True) # Intensity Factor
    tss = Column(Float, nullable=True) # Training Stress Score
    
    # AI Summary
    ai_summary = Column(String, nullable=True)

    # Time-series data stored as JSON for visualization (e.g., list of dicts)
    # [{"timestamp": 123, "lat": 45.0, "lon": 14.0, "alt": 100, "hr": 150, "power": 200, ...}]
    time_series_data = Column(JSON, nullable=True)

    user = relationship("User", back_populates="rides")

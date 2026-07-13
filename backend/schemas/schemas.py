from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List, Any
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    ftp: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class RideBase(BaseModel):
    title: Optional[str] = None

class RideCreate(RideBase):
    date: datetime
    distance: Optional[float] = None
    duration: Optional[float] = None
    avg_speed: Optional[float] = None
    max_speed: Optional[float] = None
    elevation_gain: Optional[float] = None
    avg_hr: Optional[float] = None
    max_hr: Optional[float] = None
    avg_power: Optional[float] = None
    np: Optional[float] = None
    if_factor: Optional[float] = None
    tss: Optional[float] = None
    time_series_data: Optional[List[Any]] = None

class RideResponse(RideCreate):
    id: int
    user_id: int
    ai_summary: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

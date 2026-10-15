from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReportCreate(BaseModel):
    type: str = Field(..., description="pothole, streetlight, water_leak, other")
    severity: str = Field(..., description="low, medium, high")
    latitude: float = Field(..., description="GPS latitude")
    longitude: float = Field(..., description="GPS longitude")
    description: Optional[str] = Field(None, description="Optional text description")
    photo_url: Optional[str] = Field(None, description="URL to uploaded photo")

class ReportResponse(BaseModel):
    id: str
    type: str
    severity: str
    latitude: float
    longitude: float
    description: Optional[str] = None
    photo_url: Optional[str] = None
    status: str = "pending"
    created_at: str
from pydantic import BaseModel, HttpUrl
from typing import Optional
from enum import Enum

class SummaryType(str, Enum):
    executive = "Executive Summary"
    detailed = "Detailed Notes"
    action_items = "Action Items"
    flashcards = "Flashcards"
    timestamped = "Timestamped Highlights"

class TargetAudience(str, Enum):
    general = "General"
    technical = "Technical"
    beginner = "Beginner/Kids"

class TaskCreateYouTube(BaseModel):
    url: HttpUrl
    language: str = "English"
    user_id: str
    summary_type: SummaryType = SummaryType.executive
    target_audience: TargetAudience = TargetAudience.general
    custom_prompt: Optional[str] = None

class TaskResponse(BaseModel):
    task_id: str
    message: str

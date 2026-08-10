from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from aiforec.domain.models.enums import RiskLevel


class ConsentFlags(BaseModel):
    learning_personalize: bool = True
    history_retain: bool = True
    share_learning_with_teacher: bool = False


class WeakKnowledge(BaseModel):
    tag: str
    level: int = Field(ge=1, le=5, default=2)
    evidence: str | None = None


class LearningSnapshot(BaseModel):
    subjects_focus: list[str] = Field(default_factory=list)
    weak_knowledge: list[WeakKnowledge] = Field(default_factory=list)
    strong_knowledge: list[str] = Field(default_factory=list)
    preferred_question_types: list[str] = Field(default_factory=list)
    difficulty_sweet_spot: int = Field(default=3, ge=1, le=5)
    practice_rhythm: str = "short_frequent"
    common_error_patterns: list[str] = Field(default_factory=list)
    near_term_goal: str = ""
    last_practice_snapshot: dict[str, Any] = Field(default_factory=dict)
    teaching_notes_for_ai: str = ""


class SupportSnapshot(BaseModel):
    current_mood_trend: str = "stable"
    stress_themes: list[str] = Field(default_factory=list)
    triggers: list[str] = Field(default_factory=list)
    what_helps: list[str] = Field(default_factory=list)
    what_to_avoid: list[str] = Field(default_factory=list)
    support_preference: str = "warm"
    risk_level: RiskLevel = RiskLevel.NONE
    last_risk_at: datetime | None = None
    safe_summary: str = ""
    referral_flag: bool = False


class StudentProfile(BaseModel):
    student_id: str
    profile_version: int = 1
    updated_at: datetime | None = None
    source: str = "auto_summary"
    consent: ConsentFlags = Field(default_factory=ConsentFlags)
    learning: LearningSnapshot = Field(default_factory=LearningSnapshot)
    support: SupportSnapshot = Field(default_factory=SupportSnapshot)
    needs_resummary: bool = False

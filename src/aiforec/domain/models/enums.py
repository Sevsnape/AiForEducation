from enum import StrEnum


class UserRole(StrEnum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class Intent(StrEnum):
    QUESTION_GEN = "question_gen"
    PRACTICE = "practice"
    DIAGNOSE = "diagnose"
    COUNSEL = "counsel"
    GENERAL = "general"
    SAFETY = "safety"


class RiskLevel(StrEnum):
    NONE = "none"
    WATCH = "watch"
    HIGH = "high"


class GuardDecision(StrEnum):
    ALLOW = "allow"
    DENY = "deny"
    LIMITED = "limited"


class ClientMode(StrEnum):
    AUTO = "auto"
    QUESTION_GEN = "question_gen"
    PRACTICE = "practice"
    COUNSEL = "counsel"

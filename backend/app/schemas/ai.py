from typing import Literal

from pydantic import BaseModel, Field


class NLSearchRequest(BaseModel):
    text: str = Field(min_length=1, max_length=500)


class NLSearchResult(BaseModel):
    pickup: str | None = None
    destination: str | None = None
    date: str | None = None  # ISO date, e.g. 2026-07-20
    time: str | None = None  # 24h HH:MM
    seats_needed: int = 1


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=30)


class ChatResponse(BaseModel):
    reply: str

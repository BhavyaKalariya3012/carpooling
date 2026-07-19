from datetime import date

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.core import gemini
from app.core.gemini import GeminiError
from app.models.user import User
from app.schemas.ai import (
    ChatRequest,
    ChatResponse,
    NLSearchRequest,
    NLSearchResult,
)

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


@router.post("/parse-search", response_model=NLSearchResult)
def parse_search(
    payload: NLSearchRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Natural Language Ride Search: turn free text like
    "ride to Whitefield tomorrow 9am, 1 seat" into structured search fields.
    The frontend then resolves pickup/destination to coordinates (via the map
    autocomplete) and runs the normal Find a Ride search.
    """
    try:
        parsed = gemini.parse_ride_search(
            payload.text, current_date_iso=date.today().isoformat()
        )
    except GeminiError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    # Model output is untrusted — coerce into the validated schema, ignoring
    # any unexpected/extra fields and bad types.
    seats = parsed.get("seats_needed")
    if not isinstance(seats, int) or seats < 1:
        seats = 1

    def _str_or_none(v: object) -> str | None:
        return v.strip() if isinstance(v, str) and v.strip() else None

    return NLSearchResult(
        pickup=_str_or_none(parsed.get("pickup")),
        destination=_str_or_none(parsed.get("destination")),
        date=_str_or_none(parsed.get("date")),
        time=_str_or_none(parsed.get("time")),
        seats_needed=min(seats, 20),
    )


@router.post("/chat", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    """In-app AI assistant. Answers questions and guides users through the app."""
    history = [{"role": m.role, "content": m.content} for m in payload.messages]
    try:
        reply = gemini.chat_reply(history, user_name=current_user.full_name)
    except GeminiError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return ChatResponse(reply=reply)

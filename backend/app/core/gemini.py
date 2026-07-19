"""
Isolated Gemini (Google Generative Language API) client.

All AI prompting lives here, not in route handlers (see tech.md). Model
output is treated as untrusted: JSON responses are parsed defensively and
callers validate the result against Pydantic schemas.
"""
import json
import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"


class GeminiError(RuntimeError):
    """Raised when Gemini is unavailable, unauthorized, or out of quota."""


def _is_configured() -> bool:
    return bool(settings.GEMINI_API_KEY)


def _generate(
    prompt: str,
    *,
    system: str | None = None,
    json_mode: bool = False,
    temperature: float = 0.2,
) -> str:
    """Low-level single-turn call. Returns the model's text output."""
    if not _is_configured():
        raise GeminiError("Gemini API key is not configured.")

    url = f"{_BASE_URL}/models/{settings.GEMINI_MODEL}:generateContent"
    generation_config: dict[str, Any] = {"temperature": temperature}
    if json_mode:
        generation_config["responseMimeType"] = "application/json"

    payload: dict[str, Any] = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": generation_config,
    }
    if system:
        payload["systemInstruction"] = {"parts": [{"text": system}]}

    try:
        resp = httpx.post(url, params={"key": settings.GEMINI_API_KEY}, json=payload, timeout=30)
    except httpx.HTTPError as exc:
        logger.warning("Gemini request failed: %s", exc)
        raise GeminiError("Could not reach the AI service.") from exc

    if resp.status_code == 429:
        raise GeminiError("The AI service is temporarily out of quota. Please try again later.")
    if resp.status_code == 401 or resp.status_code == 403:
        raise GeminiError("The AI service rejected the request (auth/permission).")
    if resp.status_code != 200:
        logger.warning("Gemini non-200: %s %s", resp.status_code, resp.text[:300])
        raise GeminiError("The AI service returned an error.")

    data = resp.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        # Safety blocks or empty candidates land here.
        raise GeminiError("The AI service returned no usable response.")


# --- Feature 1: Natural Language Ride Search parsing ------------------------

_SEARCH_SYSTEM = (
    "You extract structured ride-search fields from a commuter's free-text or "
    "spoken request for an enterprise carpooling app. Return ONLY JSON matching "
    "this shape: {\"pickup\": string|null, \"destination\": string|null, "
    "\"date\": string|null (ISO 8601 date like 2026-07-20, resolve relative "
    "words such as 'today'/'tomorrow' against the provided current date), "
    "\"time\": string|null (24h HH:MM), \"seats_needed\": integer (default 1)}. "
    "Use null for anything not mentioned. Do not invent locations."
)


def parse_ride_search(text: str, *, current_date_iso: str) -> dict[str, Any]:
    """Parse a natural-language ride request into structured search fields."""
    prompt = (
        f"Current date: {current_date_iso}.\n"
        f"Commuter request: {text!r}\n"
        "Extract the ride-search fields as JSON."
    )
    raw = _generate(prompt, system=_SEARCH_SYSTEM, json_mode=True, temperature=0.0)
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        raise GeminiError("Could not understand that request. Try rephrasing it.")
    if not isinstance(parsed, dict):
        raise GeminiError("Could not understand that request. Try rephrasing it.")
    return parsed


# --- Feature 2: In-app assistant chat ---------------------------------------

_CHAT_SYSTEM = (
    "You are the CommuteShare assistant, a friendly, concise helper inside an "
    "enterprise carpooling web app. CommuteShare lets verified employees of the "
    "same organization offer, find, book, track, and pay for shared commutes. "
    "Key facts you can rely on: users must belong to a registered organization "
    "(matched by email domain); the first user of an org becomes its admin; a "
    "driver must register a vehicle before offering a ride; ride lifecycle is "
    "Booked -> Started -> In Progress -> Completed -> Payment Pending -> Payment "
    "Completed; live location sharing is on only while a ride is in progress; "
    "payments use Razorpay test mode; address search uses map autocomplete. "
    "Help users accomplish tasks and answer questions about commuting and the "
    "app. Keep answers short (2-4 sentences) unless asked for detail. If a "
    "request is outside the app's scope, say so briefly. Never invent ride data "
    "or claim to have performed actions you cannot take."
)


def chat_reply(history: list[dict[str, str]], *, user_name: str | None = None) -> str:
    """Generate an assistant reply given prior turns.

    `history` is a list of {"role": "user"|"assistant", "content": str} in
    chronological order, ending with the latest user message.
    """
    if not _is_configured():
        raise GeminiError("Gemini API key is not configured.")

    url = f"{_BASE_URL}/models/{settings.GEMINI_MODEL}:generateContent"
    contents = [
        {
            "role": "model" if turn["role"] == "assistant" else "user",
            "parts": [{"text": turn["content"]}],
        }
        for turn in history
        if turn.get("content")
    ]
    if not contents:
        raise GeminiError("No message to respond to.")

    system_text = _CHAT_SYSTEM
    if user_name:
        system_text += f" The current user's name is {user_name}."

    payload = {
        "contents": contents,
        "systemInstruction": {"parts": [{"text": system_text}]},
        "generationConfig": {"temperature": 0.6},
    }

    try:
        resp = httpx.post(url, params={"key": settings.GEMINI_API_KEY}, json=payload, timeout=30)
    except httpx.HTTPError as exc:
        raise GeminiError("Could not reach the AI service.") from exc

    if resp.status_code == 429:
        raise GeminiError("The AI service is temporarily out of quota. Please try again later.")
    if resp.status_code in (401, 403):
        raise GeminiError("The AI service rejected the request (auth/permission).")
    if resp.status_code != 200:
        raise GeminiError("The AI service returned an error.")

    data = resp.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError):
        raise GeminiError("The AI service returned no usable response.")

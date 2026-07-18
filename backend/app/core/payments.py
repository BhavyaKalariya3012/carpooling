"""
Razorpay client wrapper (test mode only). Keys come from settings, which
are loaded from .env and never hardcoded or logged.
"""
import razorpay

from app.core.config import settings

_client: razorpay.Client | None = None


def get_razorpay_client() -> razorpay.Client:
    global _client
    if _client is None:
        if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
            raise RuntimeError("Razorpay keys are not configured in the environment")
        _client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    return _client

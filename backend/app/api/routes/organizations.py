import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.organization import Organization
from app.schemas.organization import OrganizationCreate, OrganizationResponse

router = APIRouter(prefix="/api/v1/organizations", tags=["organizations"])

# Basic domain shape check: one or more labels separated by dots, ending in a
# TLD of at least 2 letters. Deliberately permissive (covers acme.com,
# nirmauni.ac.in, etc.) — this is a sanity check, not full RFC validation.
_DOMAIN_RE = re.compile(r"^(?=.{3,255}$)([a-z0-9](-?[a-z0-9])*\.)+[a-z]{2,}$")


def _normalize_domain(raw: str) -> str:
    """Trim whitespace, drop a leading '@', and lowercase — matching the
    normalization used at signup so registration and login stay consistent."""
    return raw.strip().lstrip("@").lower()


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def register_organization(payload: OrganizationCreate, db: Session = Depends(get_db)):
    """
    Public endpoint to onboard a new organization. This is the entry point
    before any user exists: a company registers its name + email domain,
    after which the first employee to sign up under that domain becomes the
    org admin (see auth.signup bootstrap rule).
    """
    domain = _normalize_domain(payload.domain)
    if not _DOMAIN_RE.match(domain):
        raise HTTPException(
            status_code=400,
            detail="Enter a valid domain like 'acme.com' (no '@', no email address).",
        )

    existing = (
        db.query(Organization)
        .filter(func.lower(Organization.domain) == domain)
        .first()
    )
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail="An organization with this domain is already registered.",
        )

    org = Organization(name=payload.name.strip(), domain=domain)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org

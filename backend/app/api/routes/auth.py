from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse, UserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Normalize the submitted domain before matching: trim whitespace,
    # lowercase, and strip a leading "@" since people commonly type domains
    # that way (e.g. "@acme.com"). Organization domains are stored
    # lowercase without a leading "@", so this keeps the match forgiving
    # without weakening the underlying security check.
    normalized_domain = payload.organization_domain.strip().lstrip("@").lower()

    # Resolve org by domain. Only verified employees of a registered
    # organization may access the platform (product.md hard constraint).
    org = (
        db.query(Organization)
        .filter(func.lower(Organization.domain) == normalized_domain)
        .first()
    )
    if org is None:
        raise HTTPException(
            status_code=400,
            detail="Organization not registered. Contact your company administrator.",
        )

    # Bootstrap rule: the first person to sign up for an organization becomes
    # its admin, so there's always at least one admin to manage the org and
    # promote others. Everyone after that defaults to employee.
    is_first_user_in_org = db.query(User).filter(User.organization_id == org.id).first() is None

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        organization_id=org.id,
        role=UserRole.ADMIN if is_first_user_in_org else UserRole.EMPLOYEE,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "org_id": str(user.organization_id)})
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")

    token = create_access_token({"sub": str(user.id), "org_id": str(user.organization_id)})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

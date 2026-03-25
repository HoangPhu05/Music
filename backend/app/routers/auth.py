import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import get_db
from app.models.user import User
from app.schemas.auth import GoogleLoginRequest, LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.auth_service import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    normalized_email = body.email.strip().lower()

    result = await db.execute(select(User).where(func.lower(User.email) == normalized_email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    if len(body.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 8 characters",
        )

    user = User(email=normalized_email, hashed_password=hash_password(body.password))
    db.add(user)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    await db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    normalized_email = body.email.strip().lower()
    result = await db.execute(select(User).where(func.lower(User.email) == normalized_email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token)


@router.post("/google", response_model=TokenResponse)
async def login_with_google(body: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google login is not configured")

    try:
        payload = google_id_token.verify_oauth2_token(
            body.credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google credential")

    normalized_email = str(payload.get("email", "")).strip().lower()
    if not normalized_email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google account has no email")

    result = await db.execute(select(User).where(func.lower(User.email) == normalized_email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(email=normalized_email, hashed_password=hash_password(str(uuid.uuid4())))
        db.add(user)
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            result = await db.execute(select(User).where(func.lower(User.email) == normalized_email))
            user = result.scalar_one_or_none()
        else:
            await db.refresh(user)

    if not user:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not complete Google login")

    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token)

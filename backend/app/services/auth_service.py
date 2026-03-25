from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
import bcrypt

from app.config import settings


def hash_password(plain_password: str) -> str:
    """Trả về bcrypt hash của mật khẩu thô."""
    password_bytes = plain_password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Kiểm tra mật khẩu thô có khớp với hash không."""
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def create_access_token(subject: str) -> str:
    """
    Tạo JWT access token.
    - subject: thường là user_id (string)
    - Hết hạn sau ACCESS_TOKEN_EXPIRE_MINUTES phút
    """
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> str:
    """
    Giải mã JWT token, trả về subject (user_id).
    Raise JWTError nếu token không hợp lệ hoặc hết hạn.
    """
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    subject: str | None = payload.get("sub")
    if subject is None:
        raise JWTError("Token thiếu trường sub")
    return subject

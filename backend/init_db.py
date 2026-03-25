"""Script tạo database và user test"""
import asyncio
from sqlalchemy import text
from app.database import engine, Base, AsyncSessionLocal
from app.models.user import User
from app.models.song import Song
from app.models.playlist import Playlist
from app.models.playlist_song import PlaylistSong
from app.services.auth_service import hash_password


async def init_db():
    # Tạo tất cả bảng
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Đã tạo database và các bảng")

    # Tạo user test
    async with AsyncSessionLocal() as session:
        # Kiểm tra user đã tồn tại chưa
        result = await session.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": "test@example.com"}
        )
        existing = result.fetchone()
        
        if existing:
            print("ℹ️  User test@example.com đã tồn tại")
        else:
            user = User(
                email="test@example.com",
                hashed_password=hash_password("12345678")
            )
            session.add(user)
            await session.commit()
            print("✅ Đã tạo user test:")
            print("   📧 Email: test@example.com")
            print("   🔑 Password: 12345678")


if __name__ == "__main__":
    asyncio.run(init_db())

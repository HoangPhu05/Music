import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.song import Song
from app.models.playlist import Playlist
from app.models.playlist_song import PlaylistSong
from app.schemas.playlist import (
    PlaylistCreateRequest,
    PlaylistUpdateRequest,
    AddSongRequest,
    PlaylistResponse,
    PlaylistDetailResponse,
)
from app.schemas.song import SongResponse

router = APIRouter(prefix="/playlists", tags=["Playlist"])


@router.post("", response_model=PlaylistResponse, status_code=status.HTTP_201_CREATED)
async def create_playlist(
    body: PlaylistCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tạo playlist mới."""
    playlist = Playlist(owner_id=current_user.id, name=body.name, description=body.description)
    db.add(playlist)
    await db.commit()
    await db.refresh(playlist)
    return PlaylistResponse(
        id=playlist.id, name=playlist.name, description=playlist.description,
        created_at=playlist.created_at, updated_at=playlist.updated_at, song_count=0
    )


@router.get("", response_model=list[PlaylistResponse])
async def list_playlists(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lấy tất cả playlist của user."""
    result = await db.execute(
        select(Playlist)
        .where(Playlist.owner_id == current_user.id)
        .options(selectinload(Playlist.song_associations))
        .order_by(Playlist.created_at.desc())
    )
    playlists = result.scalars().all()
    return [
        PlaylistResponse(
            id=p.id, name=p.name, description=p.description,
            created_at=p.created_at, updated_at=p.updated_at,
            song_count=len(p.song_associations)
        )
        for p in playlists
    ]


@router.get("/{playlist_id}", response_model=PlaylistDetailResponse)
async def get_playlist(
    playlist_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lấy chi tiết playlist kèm danh sách bài hát."""
    playlist = await _get_playlist_with_songs(db, playlist_id, current_user.id)
    songs = [SongResponse.model_validate(assoc.song) for assoc in playlist.song_associations]
    return PlaylistDetailResponse(
        id=playlist.id, name=playlist.name, description=playlist.description,
        created_at=playlist.created_at, updated_at=playlist.updated_at,
        song_count=len(songs), songs=songs
    )


@router.patch("/{playlist_id}", response_model=PlaylistResponse)
async def update_playlist(
    playlist_id: uuid.UUID,
    body: PlaylistUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cập nhật tên hoặc mô tả playlist."""
    playlist = await _get_playlist_or_404(db, playlist_id, current_user.id)
    if body.name is not None:
        playlist.name = body.name
    if body.description is not None:
        playlist.description = body.description
    await db.commit()
    await db.refresh(playlist)
    return PlaylistResponse(
        id=playlist.id, name=playlist.name, description=playlist.description,
        created_at=playlist.created_at, updated_at=playlist.updated_at, song_count=0
    )


@router.delete("/{playlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_playlist(
    playlist_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Xóa playlist (bài hát gốc vẫn còn trong thư viện)."""
    playlist = await _get_playlist_or_404(db, playlist_id, current_user.id)
    await db.delete(playlist)
    await db.commit()


@router.post("/{playlist_id}/songs", status_code=status.HTTP_201_CREATED)
async def add_song_to_playlist(
    playlist_id: uuid.UUID,
    body: AddSongRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Thêm bài hát vào playlist."""
    playlist = await _get_playlist_with_songs(db, playlist_id, current_user.id)

    # Kiểm tra bài hát thuộc về user
    song_result = await db.execute(
        select(Song).where(Song.id == body.song_id, Song.owner_id == current_user.id)
    )
    song = song_result.scalar_one_or_none()
    if not song:
        raise HTTPException(status_code=404, detail="Bài hát không tồn tại")

    # Kiểm tra trùng lặp
    dup_result = await db.execute(
        select(PlaylistSong).where(
            PlaylistSong.playlist_id == playlist_id,
            PlaylistSong.song_id == body.song_id,
        )
    )
    if dup_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Bài hát đã có trong playlist")

    max_pos = len(playlist.song_associations)
    assoc = PlaylistSong(playlist_id=playlist_id, song_id=body.song_id, position=max_pos)
    db.add(assoc)
    await db.commit()
    return {"message": "Đã thêm bài hát vào playlist"}


@router.delete("/{playlist_id}/songs/{song_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_song_from_playlist(
    playlist_id: uuid.UUID,
    song_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Xóa bài hát khỏi playlist."""
    await _get_playlist_or_404(db, playlist_id, current_user.id)
    result = await db.execute(
        select(PlaylistSong).where(
            PlaylistSong.playlist_id == playlist_id,
            PlaylistSong.song_id == song_id,
        )
    )
    assoc = result.scalar_one_or_none()
    if not assoc:
        raise HTTPException(status_code=404, detail="Bài hát không có trong playlist")
    await db.delete(assoc)
    await db.commit()


# ── Helpers ──────────────────────────────────────────────────────────────────

async def _get_playlist_or_404(db: AsyncSession, playlist_id: uuid.UUID, owner_id: uuid.UUID) -> Playlist:
    result = await db.execute(
        select(Playlist).where(Playlist.id == playlist_id, Playlist.owner_id == owner_id)
    )
    playlist = result.scalar_one_or_none()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist không tồn tại")
    return playlist


async def _get_playlist_with_songs(db: AsyncSession, playlist_id: uuid.UUID, owner_id: uuid.UUID) -> Playlist:
    """Load playlist kèm song_associations và song objects."""
    result = await db.execute(
        select(Playlist)
        .where(Playlist.id == playlist_id, Playlist.owner_id == owner_id)
        .options(
            selectinload(Playlist.song_associations).selectinload(PlaylistSong.song)
        )
    )
    playlist = result.scalar_one_or_none()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist không tồn tại")
    return playlist

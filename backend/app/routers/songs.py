import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db, get_optional_user_from_header_or_query
from app.models.song import Song
from app.models.user import User
from app.schemas.song import SongListResponse, SongResponse
from app.services.storage_service import ALLOWED_FORMATS, get_file_extension, storage

router = APIRouter(prefix="/songs", tags=["Songs"])


@router.post("", response_model=SongResponse, status_code=status.HTTP_201_CREATED)
async def upload_song(
    file: UploadFile = File(...),
    title: str = "",
    artist: str = "",
    album: str = "",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ext = get_file_extension(file.filename or "")
    if ext not in ALLOWED_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file format .{ext}. Allowed: mp3, wav, flac, m4a",
        )

    file_path, file_size = await storage.save(file, str(current_user.id))
    display_title = title.strip() or (file.filename or "Unknown title").rsplit(".", 1)[0]

    song = Song(
        owner_id=current_user.id,
        title=display_title,
        artist=artist.strip() or None,
        album=album.strip() or None,
        file_path=file_path,
        file_format=ext,
        file_size_bytes=file_size,
    )
    db.add(song)
    await db.commit()
    await db.refresh(song)
    return song


@router.get("", response_model=SongListResponse)
async def list_songs(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count_result = await db.execute(
        select(func.count()).select_from(Song).where(Song.owner_id == current_user.id)
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(Song)
        .where(Song.owner_id == current_user.id)
        .order_by(Song.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    songs = result.scalars().all()
    return SongListResponse(total=total, items=list(songs))


@router.get("/{song_id}/stream")
async def stream_song(
    song_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user_from_header_or_query),
):
    song = await _get_song_or_404(db, song_id, current_user.id if current_user else None)

    public_url = storage.get_public_url(song.file_path)
    if public_url:
        return RedirectResponse(url=public_url)

    abs_path = storage.get_absolute_path(song.file_path)
    if not os.path.exists(abs_path):
        raise HTTPException(status_code=404, detail="Audio file not found on server")

    media_type_map = {
        "mp3": "audio/mpeg",
        "wav": "audio/wav",
        "flac": "audio/flac",
        "m4a": "audio/mp4",
    }
    media_type = media_type_map.get(song.file_format, "audio/mpeg")
    return FileResponse(
        path=abs_path,
        media_type=media_type,
        filename=f"{song.title}.{song.file_format}",
        headers={"Accept-Ranges": "bytes"},
    )


@router.get("/{song_id}/download")
async def download_song(
    song_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user_from_header_or_query),
):
    song = await _get_song_or_404(db, song_id, current_user.id if current_user else None)

    public_url = storage.get_public_url(song.file_path)
    if public_url:
        return RedirectResponse(url=public_url)

    abs_path = storage.get_absolute_path(song.file_path)
    if not os.path.exists(abs_path):
        raise HTTPException(status_code=404, detail="Audio file not found on server")

    return FileResponse(
        path=abs_path,
        filename=f"{song.title}.{song.file_format}",
        headers={"Content-Disposition": f'attachment; filename="{song.title}.{song.file_format}"'},
    )


@router.delete("/{song_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_song(
    song_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    song = await _get_song_or_404(db, song_id, current_user.id)
    storage.delete(song.file_path)
    await db.delete(song)
    await db.commit()


async def _get_song_or_404(db: AsyncSession, song_id: uuid.UUID, owner_id: uuid.UUID | None) -> Song:
    song_id_str = str(song_id)
    stmt = select(Song).where(Song.id == song_id_str)
    if owner_id:
        stmt = stmt.where(Song.owner_id == str(owner_id))
    result = await db.execute(stmt)
    song = result.scalar_one_or_none()
    if not song:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found")
    return song

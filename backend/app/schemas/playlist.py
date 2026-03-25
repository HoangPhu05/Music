import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.song import SongResponse


# ── Request schemas ──────────────────────────────────────────────────────────

class PlaylistCreateRequest(BaseModel):
    name: str
    description: str | None = None


class PlaylistUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None


class AddSongRequest(BaseModel):
    song_id: uuid.UUID


# ── Response schemas ─────────────────────────────────────────────────────────

class PlaylistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime
    song_count: int = 0


class PlaylistDetailResponse(PlaylistResponse):
    songs: list[SongResponse] = []

import uuid
from datetime import datetime

from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PlaylistSong(Base):
    """
    Bảng trung gian nhiều-nhiều giữa Playlist và Song.
    Cột `position` cho phép sắp xếp thứ tự bài hát trong playlist.
    """
    __tablename__ = "playlist_songs"

    playlist_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("playlists.id", ondelete="CASCADE"), primary_key=True
    )
    song_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("songs.id", ondelete="CASCADE"), primary_key=True
    )
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    playlist: Mapped["Playlist"] = relationship("Playlist", back_populates="song_associations")
    song: Mapped["Song"] = relationship("Song", back_populates="playlist_associations")

    def __repr__(self) -> str:
        return f"<PlaylistSong playlist={self.playlist_id} song={self.song_id} pos={self.position}>"

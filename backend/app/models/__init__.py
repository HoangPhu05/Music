# Import tất cả models để Alembic nhận biết khi tạo migration
from app.models.user import User
from app.models.song import Song
from app.models.playlist import Playlist
from app.models.playlist_song import PlaylistSong

__all__ = ["User", "Song", "Playlist", "PlaylistSong"]

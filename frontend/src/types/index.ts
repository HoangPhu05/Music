// Kiểu dữ liệu dùng chung cho toàn bộ frontend

export interface User {
    id: string;
    email: string;
    created_at: string;
}

export interface Song {
    id: string;
    title: string;
    artist: string | null;
    album: string | null;
    duration_seconds: number | null;
    file_format: string;
    file_size_bytes: number | null;
    created_at: string;
}

export interface SongListResponse {
    total: number;
    items: Song[];
}

export interface Playlist {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    song_count: number;
}

export interface PlaylistDetail extends Playlist {
    songs: Song[];
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
}

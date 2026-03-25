import React, { useEffect, useState, useRef } from 'react';
import { songsApi, playlistsApi } from '../api/client';
import { Song, Playlist } from '../types';
import TrackRow from '../components/TrackRow';
import { usePlayerStore } from '../store/playerStore';

export default function LibraryPage() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [addToPlaylistSong, setAddToPlaylistSong] = useState<Song | null>(null);
    const [search, setSearch] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { setQueue } = usePlayerStore();

    const fetchSongs = async () => {
        const res = await songsApi.list();
        setSongs(res.data.items);
    };

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                const songsRes = await songsApi.list();
                if (isMounted) setSongs(songsRes.data.items);
            } catch (err) {
                console.error('Load songs failed:', err);
            } finally {
                if (isMounted) setLoading(false);
            }

            try {
                const playlistsRes = await playlistsApi.list();
                if (isMounted) setPlaylists(playlistsRes.data);
            } catch (err) {
                console.error('Load playlists failed:', err);
            }
        };

        loadData();
        return () => {
            isMounted = false;
        };
    }, []);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;

        setUploading(true);
        for (let i = 0; i < files.length; i++) {
            setUploadProgress(Math.round(((i) / files.length) * 100));
            try {
                await songsApi.upload(files[i]);
            } catch (err) {
                console.error('Upload lỗi:', err);
            }
        }
        setUploadProgress(100);
        await fetchSongs();
        setUploading(false);
        setUploadProgress(0);
        // Reset input để có thể upload lại cùng file
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa bài hát này?')) return;
        await songsApi.delete(id);
        setSongs(prev => prev.filter(s => s.id !== id));
    };

    const handleAddToPlaylist = async (playlistId: string) => {
        if (!addToPlaylistSong) return;
        try {
            await playlistsApi.addSong(playlistId, addToPlaylistSong.id);
            setAddToPlaylistSong(null);
        } catch (err: any) {
            alert(err.response?.data?.detail ?? 'Lỗi thêm vào playlist');
        }
    };

    const filtered = songs.filter(s =>
        `${s.title} ${s.artist ?? ''} ${s.album ?? ''}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="pt-20 pb-28 px-4 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">🎵 Thư viện nhạc</h1>
                    <p className="text-gray-400 text-sm mt-1">{songs.length} bài hát</p>
                </div>
                <div className="flex gap-3">
                    {songs.length > 0 && (
                        <button
                            onClick={() => setQueue(songs, 0)}
                            className="btn-ghost text-sm flex items-center gap-2"
                        >
                            ▶️ Phát tất cả
                        </button>
                    )}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="btn-primary flex items-center gap-2"
                    >
                        {uploading ? `⏳ ${uploadProgress}%` : '⬆️ Upload nhạc'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".mp3,.wav,.flac,.m4a"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </div>
            </div>

            {/* Upload progress bar */}
            {uploading && (
                <div className="mb-4 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                    />
                </div>
            )}

            {/* Search */}
            <input
                type="search"
                placeholder="🔍 Tìm bài hát, nghệ sĩ, album..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input mb-4"
            />

            {/* Track list */}
            {loading ? (
                <div className="text-center py-20 text-gray-500">Đang tải...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-5xl mb-4">🎵</p>
                    <p className="text-gray-400">
                        {search ? 'Không tìm thấy bài hát' : 'Thư viện trống. Hãy upload nhạc đầu tiên!'}
                    </p>
                </div>
            ) : (
                <div className="card p-2 space-y-1">
                    {filtered.map((song, i) => (
                        <TrackRow
                            key={song.id}
                            song={song}
                            index={i}
                            allSongs={filtered}
                            onDelete={handleDelete}
                            onAddToPlaylist={setAddToPlaylistSong}
                        />
                    ))}
                </div>
            )}

            {/* Modal thêm vào playlist */}
            {addToPlaylistSong && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setAddToPlaylistSong(null)}>
                    <div className="card p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">
                            Thêm "<span className="text-brand-400">{addToPlaylistSong.title}</span>" vào:
                        </h3>
                        {playlists.length === 0 ? (
                            <p className="text-gray-400 text-sm">Chưa có playlist nào. Hãy tạo playlist trước.</p>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {playlists.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleAddToPlaylist(p.id)}
                                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-brand-600/20 text-sm transition-colors"
                                    >
                                        📋 {p.name}
                                        <span className="text-gray-500 ml-2">({p.song_count} bài)</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <button onClick={() => setAddToPlaylistSong(null)} className="btn-ghost w-full mt-4 text-sm">
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

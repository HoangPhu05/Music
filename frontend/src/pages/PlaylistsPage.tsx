import React, { useEffect, useState } from 'react';
import { playlistsApi, songsApi } from '../api/client';
import { Playlist, PlaylistDetail, Song } from '../types';
import TrackRow from '../components/TrackRow';
import { usePlayerStore } from '../store/playerStore';

export default function PlaylistsPage() {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [selected, setSelected] = useState<PlaylistDetail | null>(null);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(true);
    const [librarySongs, setLibrarySongs] = useState<Song[]>([]);
    const { setQueue } = usePlayerStore();

    useEffect(() => {
        Promise.all([
            playlistsApi.list().then(r => setPlaylists(r.data)),
            songsApi.list().then(r => setLibrarySongs(r.data.items)),
        ]).finally(() => setLoading(false));
    }, []);

    const fetchPlaylists = () => playlistsApi.list().then(r => setPlaylists(r.data));

    const handleCreate = async () => {
        if (!newName.trim()) return;
        await playlistsApi.create(newName.trim());
        setNewName('');
        setCreating(false);
        fetchPlaylists();
    };

    const handleSelectPlaylist = async (p: Playlist) => {
        const res = await playlistsApi.get(p.id);
        setSelected(res.data);
    };

    const handleDeletePlaylist = async (id: string) => {
        if (!confirm('Xóa playlist này?')) return;
        await playlistsApi.delete(id);
        setPlaylists(prev => prev.filter(p => p.id !== id));
        if (selected?.id === id) setSelected(null);
    };

    const handleRemoveSong = async (songId: string) => {
        if (!selected) return;
        await playlistsApi.removeSong(selected.id, songId);
        setSelected(prev => prev ? { ...prev, songs: prev.songs.filter(s => s.id !== songId) } : null);
    };

    return (
        <div className="pt-20 pb-28 px-4 max-w-6xl mx-auto">
            <div className="flex gap-6 h-[calc(100vh-12rem)]">

                {/* Sidebar: danh sách playlists */}
                <aside className="w-72 flex-shrink-0 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white">📋 Playlist</h2>
                        <button
                            onClick={() => setCreating(!creating)}
                            className="btn-primary text-sm py-1.5 px-3"
                        >
                            + Tạo mới
                        </button>
                    </div>

                    {/* Form tạo mới */}
                    {creating && (
                        <div className="card p-3 space-y-2">
                            <input
                                autoFocus
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                placeholder="Tên playlist..."
                                className="input text-sm py-2"
                            />
                            <div className="flex gap-2">
                                <button onClick={handleCreate} className="btn-primary text-sm py-1.5 flex-1">Tạo</button>
                                <button onClick={() => setCreating(false)} className="btn-ghost text-sm py-1.5">Hủy</button>
                            </div>
                        </div>
                    )}

                    {/* List playlists */}
                    <div className="flex-1 overflow-y-auto space-y-1">
                        {loading ? (
                            <p className="text-gray-500 text-sm py-4 text-center">Đang tải...</p>
                        ) : playlists.length === 0 ? (
                            <p className="text-gray-500 text-sm py-8 text-center">Chưa có playlist nào</p>
                        ) : (
                            playlists.map(p => (
                                <div
                                    key={p.id}
                                    className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all ${selected?.id === p.id ? 'bg-brand-600/20 border border-brand-500/30' : 'hover:bg-white/5'
                                        }`}
                                    onClick={() => handleSelectPlaylist(p)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${selected?.id === p.id ? 'text-brand-300' : 'text-white'}`}>
                                            {p.name}
                                        </p>
                                        <p className="text-xs text-gray-500">{p.song_count} bài</p>
                                    </div>
                                    <button
                                        onClick={e => { e.stopPropagation(); handleDeletePlaylist(p.id); }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                {/* Main panel: chi tiết playlist */}
                <main className="flex-1 card p-4 overflow-hidden flex flex-col">
                    {!selected ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-5xl mb-4">📋</p>
                                <p className="text-gray-400">Chọn một playlist để xem nội dung</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Playlist header */}
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                                <div>
                                    <h2 className="text-xl font-bold text-white">{selected.name}</h2>
                                    {selected.description && (
                                        <p className="text-gray-400 text-sm mt-0.5">{selected.description}</p>
                                    )}
                                    <p className="text-gray-500 text-xs mt-1">{selected.songs.length} bài hát</p>
                                </div>
                                {selected.songs.length > 0 && (
                                    <button
                                        onClick={() => setQueue(selected.songs, 0)}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        ▶️ Phát
                                    </button>
                                )}
                            </div>

                            {/* Song list */}
                            <div className="flex-1 overflow-y-auto">
                                {selected.songs.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-4xl mb-3">🎵</p>
                                        <p className="text-gray-400 text-sm">
                                            Playlist trống. Thêm bài từ Thư viện bằng nút ➕.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {selected.songs.map((song, i) => (
                                            <TrackRow
                                                key={song.id}
                                                song={song}
                                                index={i}
                                                allSongs={selected.songs}
                                                onDelete={handleRemoveSong}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import TrackRow from '../components/TrackRow';
import { playlistsApi, songsApi } from '../api/client';
import { usePlayerStore } from '../store/playerStore';
import { Playlist, PlaylistDetail, Song } from '../types';

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
            playlistsApi.list().then((r) => setPlaylists(r.data)),
            songsApi.list().then((r) => setLibrarySongs(r.data.items)),
        ]).finally(() => setLoading(false));
    }, []);

    const fetchPlaylists = () => playlistsApi.list().then((r) => setPlaylists(r.data));

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
        if (!confirm('Xoa playlist nay?')) return;
        await playlistsApi.delete(id);
        setPlaylists((prev) => prev.filter((p) => p.id !== id));
        if (selected?.id === id) setSelected(null);
    };

    const handleRemoveSong = async (songId: string) => {
        if (!selected) return;
        await playlistsApi.removeSong(selected.id, songId);
        setSelected((prev) => (prev ? { ...prev, songs: prev.songs.filter((s) => s.id !== songId) } : null));
    };

    return (
        <div className="pt-28 sm:pt-20 pb-32 px-3 sm:px-4 max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-[calc(100vh-12rem)]">
                <aside className="w-full lg:w-72 lg:flex-shrink-0 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white">Playlist</h2>
                        <button onClick={() => setCreating(!creating)} className="btn-primary text-xs sm:text-sm py-1.5 px-3">
                            + Tao moi
                        </button>
                    </div>

                    {creating && (
                        <div className="card p-3 space-y-2">
                            <input
                                autoFocus
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                placeholder="Ten playlist..."
                                className="input text-sm py-2"
                            />
                            <div className="flex gap-2">
                                <button onClick={handleCreate} className="btn-primary text-sm py-1.5 flex-1">
                                    Tao
                                </button>
                                <button onClick={() => setCreating(false)} className="btn-ghost text-sm py-1.5">
                                    Huy
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto space-y-1 max-h-64 lg:max-h-none">
                        {loading ? (
                            <p className="text-gray-500 text-sm py-4 text-center">Dang tai...</p>
                        ) : playlists.length === 0 ? (
                            <p className="text-gray-500 text-sm py-8 text-center">Chua co playlist nao</p>
                        ) : (
                            playlists.map((p) => (
                                <div
                                    key={p.id}
                                    className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all ${
                                        selected?.id === p.id ? 'bg-brand-600/20 border border-brand-500/30' : 'hover:bg-white/5'
                                    }`}
                                    onClick={() => handleSelectPlaylist(p)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${selected?.id === p.id ? 'text-brand-300' : 'text-white'}`}>
                                            {p.name}
                                        </p>
                                        <p className="text-xs text-gray-500">{p.song_count} bai</p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeletePlaylist(p.id);
                                        }}
                                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                <main className="flex-1 card p-3 sm:p-4 overflow-hidden flex flex-col min-h-[320px] lg:min-h-0">
                    {!selected ? (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-gray-400 text-sm">Chon mot playlist de xem noi dung</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-white/10">
                                <div className="min-w-0">
                                    <h2 className="text-lg sm:text-xl font-bold text-white truncate">{selected.name}</h2>
                                    <p className="text-gray-500 text-xs mt-1">{selected.songs.length} bai hat</p>
                                </div>
                                {selected.songs.length > 0 && (
                                    <button onClick={() => setQueue(selected.songs, 0)} className="btn-primary text-sm">
                                        Phat
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {selected.songs.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-400 text-sm">Playlist trong. Them bai tu Thu vien.</p>
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

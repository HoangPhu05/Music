import React, { useEffect, useRef, useState } from 'react';
import TrackRow from '../components/TrackRow';
import { songsApi, playlistsApi } from '../api/client';
import { usePlayerStore } from '../store/playerStore';
import { Playlist, Song } from '../types';

export default function LibraryPage() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showUploadOptions, setShowUploadOptions] = useState(false);
    const [addToPlaylistSong, setAddToPlaylistSong] = useState<Song | null>(null);
    const [search, setSearch] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const anyFileInputRef = useRef<HTMLInputElement>(null);
    const recorderInputRef = useRef<HTMLInputElement>(null);
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
            } finally {
                if (isMounted) setLoading(false);
            }

            try {
                const playlistsRes = await playlistsApi.list();
                if (isMounted) setPlaylists(playlistsRes.data);
            } catch {
                // Ignore playlist load errors on this page.
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
            setUploadProgress(Math.round((i / files.length) * 100));
            try {
                await songsApi.upload(files[i]);
            } catch {
                // Continue uploading remaining files.
            }
        }

        setUploadProgress(100);
        await fetchSongs();
        setUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (anyFileInputRef.current) anyFileInputRef.current.value = '';
        if (recorderInputRef.current) recorderInputRef.current.value = '';
    };

    const openDefaultAudioPicker = () => {
        setShowUploadOptions(false);
        fileInputRef.current?.click();
    };

    const openAnyFilePicker = () => {
        setShowUploadOptions(false);
        anyFileInputRef.current?.click();
    };

    const openRecorder = () => {
        setShowUploadOptions(false);
        recorderInputRef.current?.click();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xoa bai hat nay?')) return;
        await songsApi.delete(id);
        setSongs((prev) => prev.filter((s) => s.id !== id));
    };

    const handleAddToPlaylist = async (playlistId: string) => {
        if (!addToPlaylistSong) return;
        try {
            await playlistsApi.addSong(playlistId, addToPlaylistSong.id);
            setAddToPlaylistSong(null);
        } catch (err: any) {
            alert(err.response?.data?.detail ?? 'Loi them vao playlist');
        }
    };

    const handleSongUpdated = (updatedSong: Song) => {
        setSongs((prev) => prev.map((song) => (song.id === updatedSong.id ? { ...song, ...updatedSong } : song)));
    };

    const filtered = songs.filter((s) =>
        `${s.title} ${s.artist ?? ''} ${s.album ?? ''}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="pt-28 sm:pt-20 pb-32 px-3 sm:px-4 max-w-4xl mx-auto">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Thư viện nhạc</h1>
                    <p className="text-gray-400 text-sm mt-1">{songs.length} bài hát</p>
                </div>

                <div className="flex w-full sm:w-auto gap-2 sm:gap-3">
                    {songs.length > 0 && (
                        <button onClick={() => setQueue(songs, 0)} className="btn-ghost text-xs sm:text-sm flex-1 sm:flex-none">
                            Phát tất cả
                        </button>
                    )}
                    <button
                        onClick={() => setShowUploadOptions(true)}
                        disabled={uploading}
                        className="btn-primary text-xs sm:text-sm flex-1 sm:flex-none"
                    >
                        {uploading ? `${uploadProgress}%` : 'Upload nhạc'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*,.mp3,.wav,.flac,.m4a"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <input
                        ref={anyFileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <input
                        ref={recorderInputRef}
                        type="file"
                        accept="audio/*"
                        capture="user"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </div>
            </div>

            {uploading && (
                <div className="mb-4 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                    />
                </div>
            )}

            <input
                type="search"
                placeholder="Tìm bài hát, nghệ sĩ, album..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input mb-4"
            />

            {loading ? (
                <div className="text-center py-20 text-gray-500">Dang tai...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-400">{search ? 'Không tìm thấy bài hát' : 'Thư viện trong. Hay upload nhạc.'}</p>
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
                            onSongUpdated={handleSongUpdated}
                        />
                    ))}
                </div>
            )}

            {addToPlaylistSong && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setAddToPlaylistSong(null)}
                >
                    <div className="card p-5 sm:p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-base sm:text-lg font-semibold mb-4 break-words">
                            Them "{addToPlaylistSong.title}" vao:
                        </h3>
                        {playlists.length === 0 ? (
                            <p className="text-gray-400 text-sm">Chua co playlist nao.</p>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {playlists.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleAddToPlaylist(p.id)}
                                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-brand-600/20 text-sm transition-colors"
                                    >
                                        {p.name}
                                        <span className="text-gray-500 ml-2">({p.song_count} bai)</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <button onClick={() => setAddToPlaylistSong(null)} className="btn-ghost w-full mt-4 text-sm">
                            Dong
                        </button>
                    </div>
                </div>
            )}

            {showUploadOptions && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-3 sm:p-4"
                    onClick={() => setShowUploadOptions(false)}
                >
                    <div
                        className="card w-full max-w-sm p-4 sm:p-5 rounded-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base sm:text-lg font-semibold mb-3">Chọn cách thêm nhạc</h3>
                        <div className="space-y-2">
                            <button
                                onClick={openDefaultAudioPicker}
                                className="w-full text-left px-4 py-3 rounded-xl hover:bg-brand-600/20 text-sm transition-colors"
                            >
                                Chọn từ Thư viện nhạc
                            </button>
                            <button
                                onClick={openAnyFilePicker}
                                className="w-full text-left px-4 py-3 rounded-xl hover:bg-brand-600/20 text-sm transition-colors"
                            >
                                Chọn từ Tất cả tệp
                            </button>
                            <button
                                onClick={openRecorder}
                                className="w-full text-left px-4 py-3 rounded-xl hover:bg-brand-600/20 text-sm transition-colors"
                            >
                                Ghi âm nhanh (nếu thiết bị hỗ trợ)
                            </button>
                        </div>
                        <p className="text-center text-xs text-gray-500 mt-4">Đinh Hoàng Phú</p>
                        <button
                            onClick={() => setShowUploadOptions(false)}
                            className="btn-ghost w-full mt-4 text-sm"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

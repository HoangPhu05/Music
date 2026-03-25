import React from 'react';
import { songsApi } from '../api/client';
import { usePlayerStore } from '../store/playerStore';
import { Song } from '../types';

interface Props {
    song: Song;
    index: number;
    allSongs: Song[];
    onDelete?: (id: string) => void;
    onAddToPlaylist?: (song: Song) => void;
}

function formatDuration(sec: number | null) {
    if (!sec) return '--:--';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TrackRow({ song, index, allSongs, onDelete, onAddToPlaylist }: Props) {
    const { currentIndex, queue, setQueue, isPlaying } = usePlayerStore();
    const isCurrentSong = queue[currentIndex]?.id === song.id;

    const handlePlay = () => {
        if (isCurrentSong) {
            usePlayerStore.getState().togglePlay();
        } else {
            setQueue(allSongs, index);
        }
    };

    const handleDownload = () => {
        const token = localStorage.getItem('access_token');
        fetch(songsApi.downloadUrl(song.id), {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.blob())
            .then((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${song.title}.${song.file_format}`;
                a.click();
                URL.revokeObjectURL(url);
            });
    };

    return (
        <div
            className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl group transition-all duration-200 cursor-pointer ${
                isCurrentSong ? 'bg-brand-600/15 border border-brand-500/30' : 'hover:bg-white/5'
            }`}
            onClick={handlePlay}
        >
            <div className="w-6 sm:w-7 text-center flex-shrink-0">
                {isCurrentSong && isPlaying ? (
                    <span className="flex gap-0.5 items-end h-4 justify-center">
                        {[0, 0.2, 0.4].map((delay, i) => (
                            <span
                                key={i}
                                className="w-1 bg-brand-400 rounded-sm animate-pulse-bar"
                                style={{ animationDelay: `${delay}s` }}
                            />
                        ))}
                    </span>
                ) : (
                    <span className={`text-xs sm:text-sm ${isCurrentSong ? 'text-brand-400' : 'text-gray-500'}`}>
                        {index + 1}
                    </span>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isCurrentSong ? 'text-brand-300' : 'text-white'}`}>
                    {song.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                    {[song.artist, song.album].filter(Boolean).join(' • ') || 'Khong ro nghe si'}
                </p>
            </div>

            <span className="text-xs text-gray-500 hidden sm:block">{song.file_format.toUpperCase()}</span>
            <span className="text-xs text-gray-400 w-12 text-right hidden sm:block">{formatDuration(song.duration_seconds)}</span>

            <div
                className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
            >
                {onAddToPlaylist && (
                    <button
                        onClick={() => onAddToPlaylist(song)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-xs"
                        title="Them vao playlist"
                    >
                        ➕
                    </button>
                )}
                <button
                    onClick={handleDownload}
                    className="p-1.5 rounded-lg hover:bg-brand-600/20 text-gray-400 hover:text-brand-300 transition-colors text-xs"
                    title="Tai xuong"
                >
                    ⬇️
                </button>
                {onDelete && (
                    <button
                        onClick={() => onDelete(song.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors text-xs"
                        title="Xoa"
                    >
                        🗑️
                    </button>
                )}
            </div>
        </div>
    );
}

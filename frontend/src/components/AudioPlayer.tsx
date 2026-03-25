import React, { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { songsApi } from '../api/client';

const PlayIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M8 5v14l11-7z" />
    </svg>
);

const PauseIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);

const SkipNextIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M6 18l8.5-6L6 6v12zm8.5-6L21 6v12l-6.5-6z" />
    </svg>
);

const SkipPrevIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
    </svg>
);

const ShuffleIcon = ({ active }: { active: boolean }) => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`w-4 h-4 transition-colors ${active ? 'text-brand-400' : 'text-gray-500'}`}
    >
        <path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17zm4.76-.08 3.15 3.15-3.15 3.15L17 17l4.95-4.95L17 7.09zM1.39 4.22 10.17 13l-4.76 4.76L7 19.17 12.83 13.34l7.78 7.78 1.39-1.42L2.78 2.8z" />
    </svg>
);

function formatTime(sec: number | null): string {
    if (!sec) return '--:--';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioPlayer() {
    const { queue, currentIndex, isPlaying, isShuffle, playNext, playPrev, togglePlay, toggleShuffle, setPlaying } =
        usePlayerStore();

    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const currentSong = queue[currentIndex] ?? null;

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentSong) return;

        const nextSrc = songsApi.streamUrl(currentSong.id);
        const nextSrcAbsolute = new URL(nextSrc, window.location.origin).href;
        if (audio.src !== nextSrcAbsolute) {
            audio.src = nextSrc;
            audio.load();
            setCurrentTime(0);
            setDuration(0);
        }

        if (!isPlaying) {
            audio.pause();
            return;
        }

        audio.play().catch(() => {
            const retryOnCanPlay = () => {
                audio.play().catch(() => {
                    setPlaying(false);
                });
            };
            audio.addEventListener('canplay', retryOnCanPlay, { once: true });
        });
    }, [currentSong?.id, isPlaying, setPlaying]);

    const handleTimeUpdate = () => {
        setCurrentTime(audioRef.current?.currentTime ?? 0);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = Number(e.target.value);
        if (audioRef.current) audioRef.current.currentTime = t;
        setCurrentTime(t);
    };

    const handleAudioError = () => {
        playNext();
    };

    if (!currentSong) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 px-4 py-3">
            <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
                onEnded={playNext}
                onError={handleAudioError}
                crossOrigin="use-credentials"
            />

            <div className="max-w-6xl mx-auto flex items-center gap-4">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{currentSong.title}</p>
                    <p className="text-xs text-gray-400 truncate">{currentSong.artist ?? 'Unknown'}</p>
                </div>

                <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleShuffle}
                            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                            title="Shuffle"
                        >
                            <ShuffleIcon active={isShuffle} />
                        </button>

                        <button
                            onClick={playPrev}
                            className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                        >
                            <SkipPrevIcon />
                        </button>

                        <button
                            onClick={togglePlay}
                            className="w-10 h-10 rounded-full bg-brand-600 hover:bg-brand-500 flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-brand-600/30"
                        >
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>

                        <button
                            onClick={playNext}
                            className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                        >
                            <SkipNextIcon />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 w-full max-w-sm">
                        <span className="text-xs text-gray-500 w-10 text-right">{formatTime(currentTime)}</span>
                        <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            className="flex-1 h-1 accent-brand-500 cursor-pointer"
                        />
                        <span className="text-xs text-gray-500 w-10">{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="flex-1 flex justify-end">
                    <p className="text-xs text-gray-500">
                        {currentIndex + 1} / {queue.length}
                        {isShuffle && <span className="ml-1 text-brand-400">Shuffle</span>}
                    </p>
                </div>
            </div>
        </div>
    );
}

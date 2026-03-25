import React, { useEffect, useMemo, useRef, useState } from 'react';
import { songsApi } from '../api/client';
import { usePlayerStore } from '../store/playerStore';

const PlayIcon = ({ big = false }: { big?: boolean }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={big ? 'w-8 h-8' : 'w-5 h-5 sm:w-6 sm:h-6'}>
        <path d="M8 5v14l11-7z" />
    </svg>
);

const PauseIcon = ({ big = false }: { big?: boolean }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={big ? 'w-8 h-8' : 'w-5 h-5 sm:w-6 sm:h-6'}>
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);

const SkipNextIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
        <path d="M6 18l8.5-6L6 6v12zm8.5-6L21 6v12l-6.5-6z" />
    </svg>
);

const SkipPrevIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
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

function formatCountdown(ms: number): string {
    if (ms <= 0) return '00:00';
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioPlayer() {
    const { queue, currentIndex, isPlaying, isShuffle, playNext, playPrev, togglePlay, toggleShuffle, setPlaying } =
        usePlayerStore();

    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showTimerMenu, setShowTimerMenu] = useState(false);
    const [sleepUntil, setSleepUntil] = useState<number | null>(null);
    const [nowTick, setNowTick] = useState(Date.now());
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

    useEffect(() => {
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsExpanded(false);
                setShowTimerMenu(false);
            }
        };
        window.addEventListener('keydown', onEsc);
        return () => window.removeEventListener('keydown', onEsc);
    }, []);

    useEffect(() => {
        if (!sleepUntil) return;
        const timer = window.setInterval(() => {
            setNowTick(Date.now());
        }, 1000);
        return () => window.clearInterval(timer);
    }, [sleepUntil]);

    useEffect(() => {
        if (!sleepUntil) return;
        if (Date.now() >= sleepUntil) {
            setPlaying(false);
            setSleepUntil(null);
        }
    }, [sleepUntil, nowTick, setPlaying]);

    const sleepLeftMs = useMemo(() => (sleepUntil ? Math.max(0, sleepUntil - nowTick) : 0), [sleepUntil, nowTick]);

    const setSleepTimerMinutes = (minutes: number) => {
        if (minutes <= 0) {
            setSleepUntil(null);
            setShowTimerMenu(false);
            return;
        }
        setSleepUntil(Date.now() + minutes * 60 * 1000);
        setShowTimerMenu(false);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = Number(e.target.value);
        if (audioRef.current) audioRef.current.currentTime = t;
        setCurrentTime(t);
    };

    if (!currentSong) return null;

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 px-3 py-2 sm:px-4 sm:py-3">
                <audio
                    ref={audioRef}
                    onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
                    onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
                    onEnded={playNext}
                    onError={playNext}
                    crossOrigin="use-credentials"
                />

                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="min-w-0 text-left rounded-lg hover:bg-white/5 px-1 py-1"
                            title="Open now playing"
                        >
                            <p className="text-sm font-semibold text-white truncate">{currentSong.title}</p>
                            <p className="text-xs text-gray-400 truncate">{currentSong.artist ?? 'Unknown'}</p>
                        </button>

                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={toggleShuffle}
                                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                                title="Shuffle"
                            >
                                <ShuffleIcon active={isShuffle} />
                            </button>
                            <button
                                onClick={playPrev}
                                className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                            >
                                <SkipPrevIcon />
                            </button>
                            <button
                                onClick={togglePlay}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-brand-600 hover:bg-brand-500 flex items-center justify-center transition-all active:scale-95"
                            >
                                {isPlaying ? <PauseIcon /> : <PlayIcon />}
                            </button>
                            <button
                                onClick={playNext}
                                className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                            >
                                <SkipNextIcon />
                            </button>
                        </div>

                        <div className="flex justify-end relative">
                            <button
                                onClick={() => setShowTimerMenu((v) => !v)}
                                className="text-xs px-2.5 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
                                title="Hen gio tat nhac"
                            >
                                {sleepUntil ? `Hen gio ${formatCountdown(sleepLeftMs)}` : 'Hen gio'}
                            </button>
                            {showTimerMenu && (
                                <div className="absolute bottom-10 right-0 w-36 card p-1.5 z-10">
                                    <button
                                        onClick={() => setSleepTimerMinutes(15)}
                                        className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-white/10"
                                    >
                                        15 phut
                                    </button>
                                    <button
                                        onClick={() => setSleepTimerMinutes(30)}
                                        className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-white/10"
                                    >
                                        30 phut
                                    </button>
                                    <button
                                        onClick={() => setSleepTimerMinutes(60)}
                                        className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-white/10"
                                    >
                                        60 phut
                                    </button>
                                    <button
                                        onClick={() => setSleepTimerMinutes(0)}
                                        className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-white/10 text-red-300"
                                    >
                                        Tat hen gio
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-[11px] text-gray-500 w-10 text-right">{formatTime(currentTime)}</span>
                        <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            className="flex-1 h-1 accent-brand-500 cursor-pointer"
                        />
                        <span className="text-[11px] text-gray-500 w-10">{formatTime(duration)}</span>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="fixed inset-0 z-[60] bg-[#111320]/95 backdrop-blur-sm">
                    <div className="h-full w-full max-w-5xl mx-auto px-4 py-5 sm:px-8 sm:py-8 flex flex-col">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="text-gray-300 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10"
                            >
                                Dong
                            </button>
                            <p className="text-xs sm:text-sm text-gray-400">Now Playing</p>
                            <div className="w-14" />
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-br from-brand-500/20 to-cyan-300/20 p-4 shadow-2xl">
                                <div
                                    className={`w-full h-full rounded-full bg-surface-900 border border-white/10 flex items-center justify-center ${
                                        isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''
                                    }`}
                                >
                                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-brand-500 to-cyan-300" />
                                </div>
                            </div>

                            <div className="mt-8 w-full max-w-2xl">
                                <p className="text-xl sm:text-3xl text-white font-semibold text-center truncate">{currentSong.title}</p>
                                <p className="text-sm sm:text-base text-gray-400 mt-2 text-center truncate">
                                    {currentSong.artist ?? 'Unknown artist'}
                                </p>

                                <div className="mt-6 sm:mt-8">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 w-10 text-right">{formatTime(currentTime)}</span>
                                        <input
                                            type="range"
                                            min={0}
                                            max={duration || 0}
                                            value={currentTime}
                                            onChange={handleSeek}
                                            className="flex-1 h-1.5 accent-brand-500 cursor-pointer"
                                        />
                                        <span className="text-xs text-gray-500 w-10">{formatTime(duration)}</span>
                                    </div>

                                    <div className="mt-7 sm:mt-8 flex items-center justify-center gap-4 sm:gap-6">
                                        <button onClick={toggleShuffle} className="p-2.5 rounded-full hover:bg-white/10">
                                            <ShuffleIcon active={isShuffle} />
                                        </button>
                                        <button onClick={playPrev} className="p-3 rounded-full hover:bg-white/10 text-gray-200">
                                            <SkipPrevIcon />
                                        </button>
                                        <button
                                            onClick={togglePlay}
                                            className="w-16 h-16 rounded-full bg-brand-600 hover:bg-brand-500 flex items-center justify-center transition-all active:scale-95"
                                        >
                                            {isPlaying ? <PauseIcon big /> : <PlayIcon big />}
                                        </button>
                                        <button onClick={playNext} className="p-3 rounded-full hover:bg-white/10 text-gray-200">
                                            <SkipNextIcon />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

import { create } from 'zustand';
import { Song } from '../types';

interface PlayerState {
    queue: Song[];
    currentIndex: number;
    isPlaying: boolean;
    isShuffle: boolean;
    shuffleOrder: number[];
    shufflePos: number;
    setQueue: (songs: Song[], startIndex?: number) => void;
    playSong: (song: Song) => void;
    playNext: () => void;
    playPrev: () => void;
    togglePlay: () => void;
    toggleShuffle: () => void;
    setPlaying: (playing: boolean) => void;
}

function shuffleArray(length: number, anchorIndex: number): number[] {
    const arr = Array.from({ length }, (_, i) => i).filter((i) => i !== anchorIndex);
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return [anchorIndex, ...arr];
}

function isValidOrder(order: number[], length: number, currentIndex: number): boolean {
    if (order.length !== length) return false;
    if (!order.includes(currentIndex)) return false;
    const seen = new Set(order);
    if (seen.size !== length) return false;
    return order.every((idx) => idx >= 0 && idx < length);
}

function safeOrder(order: number[], length: number, currentIndex: number): number[] {
    if (length <= 0) return [];
    return isValidOrder(order, length, currentIndex) ? order : shuffleArray(length, currentIndex);
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    queue: [],
    currentIndex: 0,
    isPlaying: false,
    isShuffle: false,
    shuffleOrder: [],
    shufflePos: 0,

    setQueue: (songs, startIndex = 0) => {
        const boundedIndex = songs.length ? Math.max(0, Math.min(startIndex, songs.length - 1)) : 0;
        const nextOrder = songs.length ? shuffleArray(songs.length, boundedIndex) : [];
        set({
            queue: songs,
            currentIndex: boundedIndex,
            shuffleOrder: nextOrder,
            shufflePos: 0,
            isPlaying: songs.length > 0,
        });
    },

    playSong: (song) => {
        const { queue, isShuffle } = get();
        const idx = queue.findIndex((s) => s.id === song.id);
        if (idx >= 0) {
            set({ currentIndex: idx, isPlaying: true });
            return;
        }

        set((state) => {
            const nextQueue = [...state.queue, song];
            const nextIndex = nextQueue.length - 1;
            return {
                queue: nextQueue,
                currentIndex: nextIndex,
                isPlaying: true,
                shuffleOrder: isShuffle ? shuffleArray(nextQueue.length, nextIndex) : state.shuffleOrder,
                shufflePos: 0,
            };
        });
    },

    playNext: () => {
        const { queue, currentIndex, isShuffle, shuffleOrder, shufflePos } = get();
        if (!queue.length) return;

        if (isShuffle) {
            const order = safeOrder(shuffleOrder, queue.length, currentIndex);
            const pos = Math.max(0, order.indexOf(currentIndex), shufflePos);
            const nextPos = pos + 1;

            if (nextPos < order.length) {
                set({
                    currentIndex: order[nextPos],
                    isPlaying: true,
                    shuffleOrder: order,
                    shufflePos: nextPos,
                });
                return;
            }

            // End of shuffled cycle: reshuffle again so next cycle is different.
            const nextOrder = shuffleArray(queue.length, currentIndex);
            const reshuffledNextPos = nextOrder.length > 1 ? 1 : 0;
            set({
                currentIndex: nextOrder[reshuffledNextPos],
                isPlaying: true,
                shuffleOrder: nextOrder,
                shufflePos: reshuffledNextPos,
            });
            return;
        }

        set({ currentIndex: (currentIndex + 1) % queue.length, isPlaying: true });
    },

    playPrev: () => {
        const { queue, currentIndex, isShuffle, shuffleOrder, shufflePos } = get();
        if (!queue.length) return;

        if (isShuffle) {
            const order = safeOrder(shuffleOrder, queue.length, currentIndex);
            const pos = Math.max(0, order.indexOf(currentIndex), shufflePos);
            const prevPos = pos - 1;
            if (prevPos >= 0) {
                set({
                    currentIndex: order[prevPos],
                    isPlaying: true,
                    shuffleOrder: order,
                    shufflePos: prevPos,
                });
                return;
            }
            set({
                currentIndex: order[order.length - 1],
                isPlaying: true,
                shuffleOrder: order,
                shufflePos: order.length - 1,
            });
            return;
        }

        set({ currentIndex: (currentIndex - 1 + queue.length) % queue.length, isPlaying: true });
    },

    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

    toggleShuffle: () => {
        const { queue, currentIndex, isShuffle } = get();
        if (!queue.length) {
            set({ isShuffle: !isShuffle });
            return;
        }
        if (!isShuffle) {
            set({
                isShuffle: true,
                shuffleOrder: shuffleArray(queue.length, currentIndex),
                shufflePos: 0,
            });
        } else {
            set({ isShuffle: false, shufflePos: 0 });
        }
    },

    setPlaying: (playing) => set({ isPlaying: playing }),
}));

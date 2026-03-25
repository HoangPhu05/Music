import axios from 'axios';

const DEFAULT_API_URL = 'https://music-backend-production-7d7f.up.railway.app';
const BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');

function buildUrl(path: string): string {
    // Dev mặc định đi qua Vite proxy (URL tương đối), production dùng BASE_URL tuyệt đối.
    if (BASE_URL) return `${BASE_URL}${path}`;
    return path;
}

export const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// ── Interceptor: tự động đính kèm JWT token vào mọi request ──────────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Interceptor: tự động logout khi token hết hạn (401) ──────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
    register: (email: string, password: string) =>
        api.post('/auth/register', { email, password }),

    login: (email: string, password: string) =>
        api.post<{ access_token: string; token_type: string }>('/auth/login', { email, password }),
};

// ── Songs ─────────────────────────────────────────────────────────────────────
export const songsApi = {
    list: (skip = 0, limit = 100) =>
        api.get('/songs', { params: { skip, limit } }),

    upload: (file: File, title?: string, artist?: string, album?: string) => {
        const form = new FormData();
        form.append('file', file);
        if (title) form.append('title', title);
        if (artist) form.append('artist', artist);
        if (album) form.append('album', album);
        return api.post('/songs', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    streamUrl: (id: string) => {
        const token = localStorage.getItem('access_token');
        const base = buildUrl(`/songs/${id}/stream`);
        return token ? `${base}?token=${encodeURIComponent(token)}` : base;
    },
    downloadUrl: (id: string) => {
        const token = localStorage.getItem('access_token');
        const base = buildUrl(`/songs/${id}/download`);
        return token ? `${base}?token=${encodeURIComponent(token)}` : base;
    },

    delete: (id: string) => api.delete(`/songs/${id}`),

    update: (id: string, data: { title?: string; artist?: string; album?: string }) =>
        api.patch(`/songs/${id}`, data),
};

// ── Playlists ─────────────────────────────────────────────────────────────────
export const playlistsApi = {
    list: () => api.get('/playlists'),

    get: (id: string) => api.get(`/playlists/${id}`),

    create: (name: string, description?: string) =>
        api.post('/playlists', { name, description }),

    update: (id: string, data: { name?: string; description?: string }) =>
        api.patch(`/playlists/${id}`, data),

    delete: (id: string) => api.delete(`/playlists/${id}`),

    addSong: (playlistId: string, songId: string) =>
        api.post(`/playlists/${playlistId}/songs`, { song_id: songId }),

    removeSong: (playlistId: string, songId: string) =>
        api.delete(`/playlists/${playlistId}/songs/${songId}`),
};

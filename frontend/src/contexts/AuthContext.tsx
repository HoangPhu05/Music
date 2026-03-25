import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api } from '../api/client';

interface AuthContextValue {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Khi app khởi động, kiểm tra token đã lưu
    useEffect(() => {
        const savedToken = localStorage.getItem('access_token');
        if (savedToken) {
            setToken(savedToken);
            // Không có /auth/me endpoint nên decode từ token (hoặc mock user)
            // Trong thực tế bạn nên thêm GET /auth/me vào backend
            setUser({ id: '', email: 'Đang tải...', created_at: '' });
        }
        setIsLoading(false);
    }, []);

    const login = async (accessToken: string) => {
        localStorage.setItem('access_token', accessToken);
        setToken(accessToken);
        // Lấy thông tin user sau khi login
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
        } catch {
            // Nếu chưa có endpoint /auth/me, set placeholder
            setUser({ id: '', email: '', created_at: '' });
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth phải dùng trong AuthProvider');
    return ctx;
}

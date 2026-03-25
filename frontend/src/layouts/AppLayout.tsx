import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import AudioPlayer from '../components/AudioPlayer';

/** Layout cho các trang đã đăng nhập: Navbar + nội dung + AudioPlayer */
export default function AppLayout() {
    const { token, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!token) return <Navigate to="/login" replace />;

    return (
        <div className="min-h-screen bg-surface-900">
            <Navbar />
            <main>
                <Outlet />
            </main>
            <AudioPlayer />
        </div>
    );
}

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const links = [
    { to: '/library', label: '🎵 Thư viện' },
    { to: '/playlists', label: '📋 Playlist' },
];

export default function Navbar() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/10 px-6 py-3">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <NavLink to="/library" className="flex items-center gap-2 group">
                    <span className="text-2xl group-hover:scale-110 transition-transform">🎵</span>
                    <span className="font-bold text-white tracking-tight">MusicApp</span>
                </NavLink>

                {/* Navigation links */}
                <div className="flex items-center gap-1">
                    {links.map(({ to, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-brand-600/20 text-brand-400'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`
                            }
                        >
                            {label}
                        </NavLink>
                    ))}
                </div>

                {/* Logout */}
                <button onClick={handleLogout} className="btn-ghost text-sm">
                    Đăng xuất
                </button>
            </div>
        </nav>
    );
}

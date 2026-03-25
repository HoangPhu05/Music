import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const links = [
    { to: '/library', label: 'Thu vien' },
    { to: '/playlists', label: 'Playlist' },
];

export default function Navbar() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/10 px-3 py-2 sm:px-6 sm:py-3">
            <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
                <NavLink to="/library" className="flex items-center gap-2 min-w-0">
                    <span className="text-xl sm:text-2xl">🎵</span>
                    <span className="font-bold text-white tracking-tight truncate">MusicApp</span>
                </NavLink>

                <button
                    onClick={handleLogout}
                    className="btn-ghost text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 whitespace-nowrap"
                >
                    Dang xuat
                </button>

                <div className="order-3 w-full sm:order-none sm:w-auto flex items-center gap-1 overflow-x-auto pb-0.5">
                    {links.map(({ to, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                                    isActive
                                        ? 'bg-brand-600/20 text-brand-400'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`
                            }
                        >
                            {label}
                        </NavLink>
                    ))}
                </div>
            </div>
        </nav>
    );
}

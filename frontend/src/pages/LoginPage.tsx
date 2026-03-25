import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (mode === 'register') {
                await authApi.register(email, password);
                // Sau khi đăng ký thành công, tự động đăng nhập
            }
            const res = await authApi.login(email, password);
            await login(res.data.access_token);
            navigate('/library');
        } catch (err: any) {
            setError(err.response?.data?.detail ?? 'Có lỗi xảy ra, thử lại sau');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-surface-900">
            {/* Background decorative blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-900/40 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <span className="text-6xl">🎵</span>
                    <h1 className="text-2xl font-bold text-white mt-3">MusicApp</h1>
                    <p className="text-gray-400 text-sm mt-1">Kho nhạc cá nhân của bạn</p>
                </div>

                {/* Card */}
                <div className="card p-6">
                    {/* Tab switch */}
                    <div className="flex rounded-lg bg-surface-700 p-1 mb-6">
                        {(['login', 'register'] as const).map(m => (
                            <button
                                key={m}
                                onClick={() => { setMode(m); setError(''); }}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${mode === m ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {m === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="ten@email.com"
                                required
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Mật khẩu</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Ít nhất 8 ký tự"
                                required
                                minLength={8}
                                className="input"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                            {loading ? '⏳ Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

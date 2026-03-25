import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

declare global {
    interface Window {
        google?: any;
    }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function LoginPage() {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const googleButtonRef = useRef<HTMLDivElement>(null);

    const handleGoogleCredential = async (response: { credential?: string }) => {
        if (!response.credential) return;
        setError('');
        setLoading(true);
        try {
            const res = await authApi.googleLogin(response.credential);
            await login(res.data.access_token);
            navigate('/library');
        } catch (err: any) {
            setError(err.response?.data?.detail ?? 'Không thể đăng nhập Google');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) return;

        const initGoogleButton = () => {
            if (!window.google || !googleButtonRef.current) return;
            googleButtonRef.current.innerHTML = '';
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleCredential,
            });
            window.google.accounts.id.renderButton(googleButtonRef.current, {
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
                shape: 'pill',
                width: 320,
            });
        };

        if (window.google) {
            initGoogleButton();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initGoogleButton;
        document.body.appendChild(script);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (mode === 'register') {
                await authApi.register(email, password);
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
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-900/40 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-sm">
                <div className="text-center mb-8">
                    <span className="text-6xl">🎵</span>
                    <h1 className="text-2xl font-bold text-white mt-3">MusicApp</h1>
                    <p className="text-gray-400 text-sm mt-1">Kho nhạc cá nhân của bạn</p>
                </div>

                <div className="card p-6">
                    <div className="flex rounded-lg bg-surface-700 p-1 mb-6">
                        {(['login', 'register'] as const).map((m) => (
                            <button
                                key={m}
                                onClick={() => {
                                    setMode(m);
                                    setError('');
                                }}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                    mode === m ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
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
                                onChange={(e) => setEmail(e.target.value)}
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
                                onChange={(e) => setPassword(e.target.value)}
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

                    <div className="my-4 flex items-center gap-2">
                        <div className="h-px bg-white/10 flex-1" />
                        <span className="text-xs text-gray-500">hoặc</span>
                        <div className="h-px bg-white/10 flex-1" />
                    </div>

                    {GOOGLE_CLIENT_ID ? (
                        <div className="flex justify-center">
                            <div ref={googleButtonRef} />
                        </div>
                    ) : (
                        <button
                            type="button"
                            disabled
                            className="w-full px-4 py-2.5 rounded-lg border border-white/15 text-sm text-gray-400 cursor-not-allowed"
                            title="Thiếu VITE_GOOGLE_CLIENT_ID"
                        >
                            Đăng nhập bằng Google (chưa cấu hình)
                        </button>
                    )}
                </div>

                <p className="text-center text-xs text-gray-500 mt-4">Đinh Hoàng Phú</p>
            </div>
        </div>
    );
}

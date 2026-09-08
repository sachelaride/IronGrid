import { useState } from 'react';
import { trpc } from '../utils/trpc';
import { AlertCircle, Loader2, Cpu, Database, Activity, Radio, Globe, Shield, Lock, User } from 'lucide-react';
import { Logo } from './Logo';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage, type Language } from '../context/LanguageContext';

interface LoginPageProps {
    onLoginSuccess: (user: any) => void;
}

/**
 * LoginPage - Layout horizontal de duas colunas.
 * Coluna esquerda: identidade/branding. Coluna direita: formulário.
 */
export function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const { t, language, setLanguage } = useLanguage();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [totpToken, setTotpToken] = useState('');
    const [requires2FA, setRequires2FA] = useState(false);
    const [error, setError] = useState('');

    const loginMutation = trpc.auth.login.useMutation({
        onSuccess: (data) => {
            if ('requires2FA' in data && data.requires2FA) {
                setRequires2FA(true);
                setError('');
                return;
            }
            const loginData = data as any;
            if (loginData.token) {
                localStorage.setItem('irongrid_token', loginData.token);
                onLoginSuccess(loginData.user);
            }
        },
        onError: (err) => {
            setError(err.message || t('LOGIN_AUTH_FAILED'));
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!requires2FA && (!username || !password)) {
            setError(t('LOGIN_REQUIRED_CREDENTIALS'));
            return;
        }
        if (requires2FA && !totpToken) {
            setError(t('LOGIN_REQUIRED_2FA'));
            return;
        }
        loginMutation.mutate({ username, password, ...(requires2FA && { totpToken }) });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-surface-lowest relative overflow-hidden font-body selection:bg-primary selection:text-black">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-tron-grid opacity-20 pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-tr from-surface via-transparent to-primary/5 pointer-events-none" />

            {/* Ambient Glows */}
            <div className="fixed top-[-15%] left-[-10%] w-[50%] h-[50%] bg-primary/8 blur-[150px] rounded-full animate-pulse pointer-events-none" />
            <div className="fixed bottom-[-15%] right-[-10%] w-[40%] h-[40%] bg-error/5 blur-[120px] rounded-full animate-pulse pointer-events-none" />

            {/* Scanlines */}
            <div className="fixed inset-0 bg-scanline pointer-events-none opacity-[0.03]" />

            {/* Main Card — horizontal */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-[900px] px-4 sm:px-0"
            >
                <div className="glass-panel border-white/5 bg-surface-container/95 backdrop-blur-none shadow-[0_40px_100px_rgba(0,0,0,0.7)] rounded-[2rem] overflow-hidden flex flex-col lg:flex-row min-h-[480px]">

                    {/* ── TRON BORDER STREAKS ── */}
                    <div className="tron-border-wrap">
                        <div className="tron-streak-top" />
                        <div className="tron-streak-top-echo" />
                        <div className="tron-streak-right" />
                        <div className="tron-streak-right-echo" />
                        <div className="tron-streak-bottom" />
                        <div className="tron-streak-bottom-echo" />
                        <div className="tron-streak-left" />
                        <div className="tron-streak-left-echo" />
                    </div>

                    {/* ── COLUNA ESQUERDA — Identidade / Branding ── */}
                    <div className="relative flex flex-col justify-between p-8 lg:p-12 w-full lg:w-[42%] border-b lg:border-b-0 lg:border-r border-white/5 bg-gradient-to-b from-primary/5 via-transparent to-transparent">
                        {/* Corner markers */}
                        <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-primary/30 rounded-tl-[2rem]" />
                        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-primary/10 rounded-br-[1rem]" />

                        {/* Decorative CPU icon */}
                        <div className="absolute bottom-0 right-0 p-8 opacity-[0.04] pointer-events-none">
                            <Cpu size={180} />
                        </div>

                        {/* Logo + Title */}
                        <div className="flex flex-col gap-6">
                            <motion.div
                                initial={{ scale: 0.85, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="relative group w-fit"
                            >
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full group-hover:bg-primary/40 transition-all duration-700" />
                                <Logo className="relative z-10 transition-transform duration-700 group-hover:scale-105" size={80} />
                            </motion.div>

                            <div className="space-y-2">
                                <h1 className="font-display-lg text-5xl text-on-surface uppercase tracking-tighter italic leading-none">
                                    IRONGRID
                                </h1>
                                <p className="font-label-caps text-[9px] text-primary/50 uppercase tracking-[0.35em] italic font-black">
                                    Tactical Command Interface // v12-G
                                </p>
                            </div>
                        </div>

                        {/* Bottom identity block */}
                        <div className="flex flex-col gap-6 relative z-10">
                            <div className="h-px bg-white/5 w-full" />

                            <div className="space-y-1">
                                <p className="font-label-caps text-[8px] text-primary/30 uppercase tracking-[0.4em] italic font-black">ARQUITETO_DE_SISTEMAS</p>
                                <p className="font-display-lg text-base text-on-surface uppercase tracking-tighter italic leading-none">IRON GRID</p>
                            </div>

                            <div className="flex gap-5 text-on-surface-variant/20">
                                <Database size={16} className="hover:text-primary/50 transition-colors cursor-default" />
                                <Radio    size={16} className="hover:text-primary/50 transition-colors cursor-default" />
                                <Activity size={16} className="hover:text-primary/50 transition-colors cursor-default" />
                                <Globe    size={16} className="hover:text-primary/50 transition-colors cursor-default" />
                            </div>

                            <div className="space-y-1 opacity-30">
                                <p className="font-data-mono text-[7px] text-on-surface-variant uppercase tracking-[0.3em]">
                                    ENCRYPTED_NODE_AUTH
                                </p>
                                <p className="font-data-mono text-[7px] text-on-surface-variant uppercase tracking-[0.2em]">
                                    SECURE ACCESS ONLY // ENTRY IS LOGGED
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── COLUNA DIREITA — Formulário ── */}
                    <div className="flex flex-col justify-center p-8 lg:p-12 flex-1 gap-8">

                        <div className="space-y-1">
                            <p className="font-label-caps text-[9px] text-on-surface-variant/30 uppercase tracking-[0.4em] italic font-black">{t('LOGIN_ACCESS')}</p>
                            <p className="font-display-lg text-2xl text-on-surface uppercase tracking-tighter italic leading-none">{t('LOGIN_AUTH')}</p>
                        </div>

                        <div className="flex items-center bg-surface-container-highest/20 p-1 rounded-xl border border-white/5 w-fit">
                            {(['PT-BR', 'US', 'ES', 'FR', 'DE'] as Language[]).map((lang) => (
                                <button
                                    key={lang}
                                    type="button"
                                    onClick={() => setLanguage(lang)}
                                    className={`px-3 py-1.5 rounded-lg font-display-lg text-[10px] transition-all uppercase tracking-tighter ${
                                        language === lang
                                            ? 'bg-primary text-black shadow-lg shadow-primary/20 font-black'
                                            : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                                    }`}
                                >
                                    {lang === 'US' ? 'EN' : lang.split('-')[0]}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">

                            {!requires2FA ? (
                                <>
                                    {/* Username */}
                                    <div className="space-y-2">
                                        <label className="font-label-caps text-[9px] text-on-surface-variant/40 uppercase tracking-[0.35em] italic font-black ml-1">
                                            {t('LOGIN_USER')}
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30 group-focus-within:text-primary transition-colors z-10">
                                                <User size={16} />
                                            </div>
                                            <input
                                                id="login-username"
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                placeholder=""
                                                autoComplete="username"
                                                className="w-full h-13 !bg-surface-container-highest/20 border-white/5 focus:border-primary/50 pl-11 pr-4 font-data-mono text-sm rounded-xl transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-2">
                                        <label className="font-label-caps text-[9px] text-on-surface-variant/40 uppercase tracking-[0.35em] italic font-black ml-1">
                                            {t('LOGIN_PASSWORD')}
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30 group-focus-within:text-primary transition-colors z-10">
                                                <Lock size={16} />
                                            </div>
                                            <input
                                                id="login-password"
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder=""
                                                autoComplete="current-password"
                                                className="w-full h-13 !bg-surface-container-highest/20 border-white/5 focus:border-primary/50 pl-11 pr-4 font-data-mono text-sm rounded-xl transition-all"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    {/* 2FA Token */}
                                    <label className="font-label-caps text-[9px] text-on-surface-variant/40 uppercase tracking-[0.35em] italic font-black ml-1">
                                        {t('LOGIN_2FA_CODE')}
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30 group-focus-within:text-primary transition-colors z-10">
                                            <Lock size={16} />
                                        </div>
                                        <input
                                            id="login-totp"
                                            type="text"
                                            value={totpToken}
                                            onChange={(e) => setTotpToken(e.target.value)}
                                            placeholder="000000"
                                            autoComplete="one-time-code"
                                            maxLength={6}
                                            className="w-full h-13 !bg-surface-container-highest/20 border-white/5 focus:border-primary/50 pl-11 pr-4 font-data-mono text-center text-xl tracking-[0.5em] rounded-xl transition-all"
                                        />
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => { setRequires2FA(false); setTotpToken(''); }}
                                        className="text-[10px] text-primary/60 hover:text-primary italic mt-2 ml-1"
                                    >
                                        ← {t('LOGIN_BACK')}
                                    </button>
                                </div>
                            )}

                            {/* Error */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-[9px] font-data-mono uppercase tracking-[0.2em] italic font-black"
                                    >
                                        <AlertCircle size={14} className="shrink-0 animate-pulse" />
                                        <span>{error}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Submit */}
                            <button
                                id="login-submit"
                                type="submit"
                                disabled={loginMutation.isPending}
                                className="w-full h-13 bg-primary hover:bg-primary-fixed text-black font-display-lg text-lg uppercase tracking-tighter italic rounded-xl flex items-center justify-center gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all active:scale-[0.98] group relative overflow-hidden font-black mt-2"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                {loginMutation.isPending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Shield size={16} className="group-hover:scale-110 transition-transform" />
                                        <span>{t('LOGIN_START')}</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

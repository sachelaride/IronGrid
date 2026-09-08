import { useState, useEffect, useRef } from 'react';
import { trpc } from '../utils/trpc';
import { Search, Laptop, User, MapPin, Users, X, Command } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useHotkeys } from '../hooks/useHotkeys';

export function GlobalSearch() {
    const { t } = useLanguage();
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const { data: results, isLoading } = trpc.search.globalSearch.useQuery(
        { query },
        { enabled: query.length >= 2, placeholderData: { devices: [], users: [], locations: [], departments: [] } }
    );

    useHotkeys('ctrl+k', () => setIsOpen(true));
    useHotkeys('meta+k', () => setIsOpen(true));
    useHotkeys('escape', () => setIsOpen(false));

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const hasResults = results && (
        results.devices.length > 0 ||
        results.users.length > 0 ||
        results.locations.length > 0 ||
        results.departments.length > 0
    );

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-card/50 border border-border px-4 py-2 rounded-xl text-secondary hover:text-main transition-all group"
            >
                <Search className="w-4 h-4 group-hover:text-accent transition-colors" />
                <span className="text-xs font-medium pr-12">{t('SEARCH_PLACEHOLDER')}</span>
                <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 bg-border rounded border border-border text-[8px] font-bold text-secondary">
                    <Command className="w-2 h-2" /> K
                </kbd>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-start justify-center pt-20 p-4">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/85" 
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Modal */}
                    <div className="relative w-full max-w-xl bg-surface-container-high border border-white/15 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/10 flex items-center gap-4 bg-surface-container">
                            <Search className="w-6 h-6 text-accent" />
                            <input
                                autoFocus
                                placeholder={t('SEARCH_MODAL_PLACEHOLDER')}
                                className="flex-1 !bg-surface-container-high border-none outline-none text-on-surface placeholder:text-on-surface-variant/70 font-medium text-lg"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-surface-container-highest rounded-xl transition-all"
                            >
                                <X className="w-5 h-5 text-secondary hover:text-main" />
                            </button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
                            {isLoading && query.length >= 2 && (
                                <div className="p-12 text-center text-secondary italic text-sm">{t('SEARCHING_NETWORK')}</div>
                            )}

                            {!isLoading && query.length >= 2 && !hasResults && (
                                <div className="p-12 text-center text-secondary italic text-sm">{t('NO_RESULTS_FOUND')}</div>
                            )}

                            {query.length < 2 && (
                                <div className="p-12 text-center text-secondary/60 text-xs font-bold uppercase tracking-widest">
                                    {t('MIN_SEARCH_CHARS')}
                                </div>
                            )}

                            {results && (
                                <div className="space-y-6 px-2">
                                    <SearchSection title={t('NAV_DEVICES')} items={results.devices} icon={Laptop} />
                                    <SearchSection title={t('LOCATIONS')} items={results.locations} icon={MapPin} />
                                    <SearchSection title={t('DEPARTMENTS')} items={results.departments} icon={Users} />
                                    <SearchSection title={t('USERS')} items={results.users} icon={User} />
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-white/10 bg-surface-container flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className="text-on-surface-variant/70">IronGrid Intelligence</span>
                            <div className="flex gap-4">
                                <span className="text-secondary italic flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.5 bg-surface-container-highest border border-white/10 rounded text-[8px]">ESC</span>
                                    {t('CLOSE')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

function SearchSection({ title, items, icon: Icon }: any) {
    if (!items || items.length === 0) return null;

    return (
        <div className="space-y-1">
            <h4 className="px-2 text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <Icon className="w-3 h-3" /> {title}
            </h4>
            <div className="space-y-0.5">
                {items.map((item: any) => (
                    <button
                        key={item.id}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 dark:hover:bg-slate-900 transition-colors group flex items-start flex-col"
                        onClick={() => {
                            // TODO: Implementar navegação ou foco no item
                            console.log('Selecionado:', item);
                        }}
                    >
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-accent dark:group-hover:text-accent transition-colors">{item.name}</span>
                        {item.ipAddress && <span className="text-[10px] font-mono text-secondary leading-none">{item.ipAddress}</span>}
                        {item.location && <span className="text-[9px] text-accent dark:text-accent leading-none font-bold italic">{item.location.name}</span>}
                        {item.department && <span className="text-[9px] text-emerald-600 dark:text-emerald-400 leading-none font-bold italic">{item.location?.name} › {item.department.name}</span>}
                    </button>
                ))}
            </div>
        </div>
    );
}

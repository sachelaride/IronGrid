import { ExternalLink, BookOpen } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const manualByLanguage: Record<string, string> = {
    'PT-BR': '/manual/index.html',
    US: '/manual/index-en.html',
    ES: '/manual/index-es.html',
    FR: '/manual/index-fr.html',
    DE: '/manual/index-de.html',
};

export function ManualViewer() {
    const { t, language } = useLanguage();
    const manualUrl = manualByLanguage[language] || manualByLanguage['PT-BR'];

    return (
        <div className="h-[calc(100vh-9rem)] flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <BookOpen size={22} />
                    </div>
                    <div>
                        <h1 className="font-display-lg text-3xl text-on-surface uppercase tracking-tight italic">{t('MANUAL_TITLE')}</h1>
                        <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.25em]">{t('MANUAL_SUBTITLE')}</p>
                    </div>
                </div>
                <a
                    href={manualUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="h-11 px-4 rounded-lg bg-primary text-black font-label-caps text-[10px] uppercase tracking-widest font-black flex items-center gap-2"
                >
                    <ExternalLink size={15} />
                    {t('MANUAL_OPEN_NEW')}
                </a>
            </div>
            <iframe
                title={t('MANUAL_TITLE')}
                src={manualUrl}
                className="w-full flex-1 rounded-xl border border-white/10 bg-white"
            />
        </div>
    );
}

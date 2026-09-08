import { HeartHandshake, Mail, Phone } from 'lucide-react';
import { trpc } from '../utils/trpc';

export function ProductEditionBanner() {
    const { data } = (trpc as any).license.getStatus.useQuery(undefined, {
        refetchInterval: 5000,
        refetchOnWindowFocus: true,
    });

    if (!data) return null;

    return (
        <div className="border-b border-white/10 bg-surface-container/70 px-4 py-2 text-[11px] text-on-surface-variant backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-semibold text-on-surface">IronGrid completo, disponivel gratuitamente.</span>
                    <span>Sua contribuicao e totalmente voluntaria. O uso gratuito do IronGrid nao depende de contribuicao financeira.</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1"><Mail size={12} /> sachelaride@gmail.com</span>
                    <span className="inline-flex items-center gap-1"><Phone size={12} /> (67) 9.9859-9051</span>
                    <span className="inline-flex items-center gap-1 opacity-80"><HeartHandshake size={12} /> Contribua com o projeto PIX: 558252491-68 / sachelaride@gmail.com</span>
                </div>
            </div>
        </div>
    );
}

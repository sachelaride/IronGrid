import { HeartHandshake, Mail, Landmark } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function ContributionPage() {
    const { t } = useLanguage();

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <section className="border border-white/10 bg-surface-container/80 p-8 rounded-xl">
                <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-xl border border-primary/25 bg-primary/10 flex items-center justify-center text-primary">
                        <HeartHandshake size={26} />
                    </div>
                    <div className="space-y-3">
                        <h1 className="font-display-lg text-4xl text-primary uppercase tracking-tight italic">{t('CONTRIBUTION_TITLE')}</h1>
                        <p className="text-on-surface leading-relaxed max-w-3xl">{t('CONTRIBUTION_LIMIT')}</p>
                        <p className="text-on-surface-variant leading-relaxed max-w-3xl">{t('CONTRIBUTION_CONTACT')}</p>
                        <p className="text-on-surface-variant leading-relaxed max-w-3xl font-semibold">{t('CONTRIBUTION_VOLUNTARY')}</p>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-white/10 bg-surface-container/80 p-7 rounded-xl space-y-5">
                    <div className="flex items-center gap-3 text-primary">
                        <Mail size={22} />
                        <h2 className="font-display-lg text-2xl uppercase tracking-tight italic">PIX - Brasil</h2>
                    </div>
                    <div className="p-5 border border-white/10 bg-surface-container-highest/30 rounded-lg font-data-mono text-sm text-on-surface space-y-2">
                        <p>PIX: 558252491-68</p>
                        <p>E-mail: sachelaride@gmail.com</p>
                    </div>
                    <div className="text-sm text-on-surface-variant">
                        <p>German Sachelaride</p>
                        <p>sachelaride@gmail.com</p>
                    </div>
                </div>

                <div className="border border-white/10 bg-surface-container/80 p-7 rounded-xl space-y-5">
                    <div className="flex items-center gap-3 text-primary">
                        <Landmark size={22} />
                        <h2 className="font-display-lg text-2xl uppercase tracking-tight italic">USD Bank Channel</h2>
                    </div>
                    <pre className="p-5 border border-white/10 bg-surface-container-highest/30 rounded-lg font-data-mono text-xs text-on-surface whitespace-pre-wrap leading-relaxed">
{`Intermediary Bank - Field 56
JP Morgan Chase N.A.
SWIFT: CHASUS33
ABA: 021000021
Account: 360556937

Beneficiary Bank - Field 57
Banco Inter S.A.
SWIFT: ITEMBRSP

Beneficiary - Field 59
GERMAN DE OLIVEIRA SACHELARIDE
IBAN: BR2800416968000010011233613C1`}
                    </pre>
                </div>
            </section>
        </div>
    );
}

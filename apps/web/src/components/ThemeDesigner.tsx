import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { X, RotateCcw, Palette, Check, Layout, Sidebar, CreditCard, Type, Square, Zap, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DESIGN_TOKENS = [
    { key: 'surface', label: 'Fundo Principal', icon: Layout, category: 'Superfícies' },
    { key: 'surface-container', label: 'Cards & Painéis', icon: CreditCard, category: 'Superfícies' },
    { key: 'on-surface', label: 'Texto Principal', icon: Type, category: 'Tipografia' },
    { key: 'on-surface-variant', label: 'Texto Secundário', icon: Type, category: 'Tipografia' },
    { key: 'primary', label: 'Cor de Destaque', icon: Zap, category: 'Identidade' },
    { key: 'outline-variant', label: 'Bordas', icon: Square, category: 'Identidade' },
];

const PRESETS = [
    {
        id: 'midnight',
        name: 'Preto Meia-noite',
        desc: 'Padrão clássico',
        icon: '🌙',
        styles: { 'surface': '#10131a', 'surface-container': '#1d2026', 'on-surface': '#e1e2eb', 'primary': '#c3f5ff' }
    },
    {
        id: 'matrix',
        name: 'Matrix',
        desc: 'Verde Retrô',
        icon: '💚',
        styles: { 'surface': '#050f05', 'surface-container': '#0a190a', 'on-surface': '#32ff32', 'primary': '#32ff32' }
    },
    {
        id: 'amber',
        name: 'Alerta Âmbar',
        desc: 'NOC Orange',
        icon: '⚠️',
        styles: { 'surface': '#140a00', 'surface-container': '#1e0f00', 'on-surface': '#ffb400', 'primary': '#ffb400' }
    },
    {
        id: 'synthwave',
        name: 'Synthwave',
        desc: 'Roxo Neon',
        icon: '🎹',
        styles: { 'surface': '#0f0519', 'surface-container': '#190a28', 'on-surface': '#ff64ff', 'primary': '#ff00ff' }
    },
    {
        id: 'aurora',
        name: 'Aurora Polar',
        desc: 'Cyan Gelado',
        icon: '❄️',
        styles: { 'surface': '#04111d', 'surface-container': '#0d2230', 'on-surface': '#bfe7ff', 'primary': '#67e8f9' }
    },
    {
        id: 'sunfire',
        name: 'Sunfire NOC',
        desc: 'Laranja Quente',
        icon: '🔥',
        styles: { 'surface': '#1b0800', 'surface-container': '#2d1200', 'on-surface': '#ffd58e', 'primary': '#ff7a00' }
    },
    {
        id: 'forest',
        name: 'Forest Pulse',
        desc: 'Verde Profundo',
        icon: '🌲',
        styles: { 'surface': '#03130c', 'surface-container': '#0a2413', 'on-surface': '#b7f7c2', 'primary': '#5ee7a6' }
    },
    {
        id: 'rose',
        name: 'Rose Quartz',
        desc: 'Rosa Delicado',
        icon: '💖',
        styles: { 'surface': '#180618', 'surface-container': '#261024', 'on-surface': '#ffd7eb', 'primary': '#f472b6' }
    },
    {
        id: 'emerald',
        name: 'Esmeralda Stitch',
        desc: 'Verde Jóia',
        icon: '✨',
        styles: { 'surface': '#060a09', 'surface-container': '#0c1210', 'on-surface': '#10b981', 'primary': '#10b981' }
    }
];

export function ThemeDesigner({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const { customStyles, updateCustomStyle, resetCustomStyles, setTheme, applyPresetStyles, theme } = useTheme();
    const [activeTab, setActiveTab] = useState<'colors' | 'presets'>('presets');
    const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);

    // Helper to get current color (either custom or from CSS variable)
    const getColor = (key: string) => {
        if (customStyles[key]) return customStyles[key];
        return '#000000'; 
    };

    const applyPreset = (preset: typeof PRESETS[0]) => {
        resetCustomStyles();
        if (preset.id) {
            setTheme(preset.id as any);
        }
        if (preset.styles) {
            applyPresetStyles(preset.styles as Record<string, string>);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100]" 
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-[#0d1017] border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-[101] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 bg-[#13161f] flex-shrink-0">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-gradient-to-br from-cyan-500/30 to-purple-500/30 rounded-xl border border-white/10">
                                        <Palette className="w-6 h-6 text-cyan-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Seletor de Temas</h2>
                                        <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mt-1">Escolha ou customize sua interface</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-white/10 bg-[#0d1017] flex-shrink-0 px-6">
                            <button 
                                onClick={() => setActiveTab('presets')}
                                className={`py-4 px-2 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${
                                    activeTab === 'presets' 
                                    ? 'text-cyan-400 border-cyan-400' 
                                    : 'text-gray-500 border-transparent hover:text-gray-300'
                                }`}
                            >
                                <Sparkles className="w-4 h-4 inline mr-2" /> Temas Prontos
                            </button>
                            <button 
                                onClick={() => setActiveTab('colors')}
                                className={`py-4 px-2 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${
                                    activeTab === 'colors' 
                                    ? 'text-cyan-400 border-cyan-400' 
                                    : 'text-gray-500 border-transparent hover:text-gray-300'
                                }`}
                            >
                                <Palette className="w-4 h-4 inline mr-2" /> Customizar
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0d1017]">
                            {activeTab === 'presets' ? (
                                <div className="p-6 space-y-6">
                                    <motion.div 
                                        className="grid grid-cols-1 md:grid-cols-2 gap-5"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ staggerChildren: 0.05 }}
                                    >
                                        {PRESETS.map((preset, idx) => (
                                            <motion.button
                                                key={preset.id}
                                                onClick={() => applyPreset(preset)}
                                                onMouseEnter={() => setHoveredTheme(preset.id)}
                                                onMouseLeave={() => setHoveredTheme(null)}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={`group relative rounded-2xl overflow-hidden border-2 transition-all ${
                                                    theme === preset.id 
                                                    ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]' 
                                                    : 'border-white/10 hover:border-white/30'
                                                }`}
                                            >
                                                {/* Miniatura Visual */}
                                                <div className="relative h-32 overflow-hidden bg-[#0a0e14]">
                                                    {/* Cores da Paleta */}
                                                    <div className="absolute inset-0 flex">
                                                        <div 
                                                            className="flex-1" 
                                                            style={{ backgroundColor: (preset.styles as any)['surface'] || '#000' }}
                                                        />
                                                        <div 
                                                            className="flex-1" 
                                                            style={{ backgroundColor: (preset.styles as any)['surface-container'] || '#000' }}
                                                        />
                                                        <div 
                                                            className="flex-1" 
                                                            style={{ backgroundColor: (preset.styles as any)['primary'] || '#000' }}
                                                        />
                                                        <div 
                                                            className="flex-1" 
                                                            style={{ backgroundColor: (preset.styles as any)['on-surface'] || '#000' }}
                                                        />
                                                    </div>

                                                    {/* Overlay Preview */}
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/30 transition-all">
                                                        <div className="text-4xl drop-shadow-lg">{preset.icon}</div>
                                                    </div>

                                                    {/* Check Mark */}
                                                    {theme === preset.id && (
                                                        <motion.div 
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="absolute top-2 right-2 w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center shadow-lg"
                                                        >
                                                            <Check className="w-5 h-5 text-black font-black" />
                                                        </motion.div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="p-4 bg-[#0a0e14]/90 backdrop-blur-sm">
                                                    <h3 className="font-black text-white uppercase tracking-tight text-sm">{preset.name}</h3>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{preset.desc}</p>
                                                    <div className="flex gap-2 mt-3">
                                                        {['surface', 'surface-container', 'primary', 'on-surface'].map((k) => (
                                                            <motion.div 
                                                                key={k}
                                                                className="flex-1 h-2 rounded-full border border-white/10 group-hover:border-white/30 transition-all"
                                                                style={{ backgroundColor: (preset.styles as any)[k] || '#000' }}
                                                                whileHover={{ scale: 1.1 }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </motion.div>
                                </div>
                            ) : (
                                <div className="p-6 space-y-8">
                                    {['Superfícies', 'Tipografia', 'Identidade'].map(cat => (
                                        <motion.div key={cat} className="space-y-4"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <h3 className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.2em] border-b border-white/10 pb-3">
                                                {cat}
                                            </h3>
                                            <div className="grid gap-4">
                                                {DESIGN_TOKENS.filter(t => t.category === cat).map(token => (
                                                    <motion.div 
                                                        key={token.key} 
                                                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-cyan-400/50 transition-all group"
                                                        whileHover={{ y: -2 }}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2.5 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                                                                <token.icon className="w-4 h-4 text-cyan-400" />
                                                            </div>
                                                            <span className="text-xs font-bold text-white uppercase tracking-wide">{token.label}</span>
                                                        </div>
                                                        <div className="relative flex items-center gap-3">
                                                            <input 
                                                                type="color" 
                                                                value={getColor(token.key)}
                                                                onChange={(e) => updateCustomStyle(token.key, e.target.value)}
                                                                className="w-12 h-12 rounded-lg bg-transparent border-none cursor-pointer p-0 overflow-hidden hover:scale-110 transition-transform"
                                                            />
                                                            <div 
                                                                className="absolute inset-0 rounded-lg pointer-events-none border-2 border-cyan-400/50"
                                                                style={{ backgroundColor: getColor(token.key) }}
                                                            />
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 bg-[#0a0e14] flex-shrink-0 flex gap-3">
                            <button 
                                onClick={resetCustomStyles}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-white/10"
                            >
                                <RotateCcw className="w-4 h-4" /> Resetar
                            </button>
                            <button 
                                onClick={onClose}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-black uppercase tracking-widest text-[10px] shadow-lg shadow-cyan-500/30 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <Check className="w-4 h-4" /> Aplicar & Fechar
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}


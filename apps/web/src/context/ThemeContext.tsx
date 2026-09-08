import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Define os tipos de temas suportados pela aplicação (todos em modo escuro).
 */
type Theme = 'midnight' | 'dark' | 'emerald' | 'calendar' | 'ocean' | 'matrix' | 'amber' | 'synthwave' | 'aurora' | 'sunfire' | 'forest' | 'rose';

/**
 * Estrutura do contexto de tema.
 */
interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    customStyles: Record<string, string>;
    updateCustomStyle: (key: string, value: string) => void;
    applyPresetStyles: (styles: Record<string, string>) => void;
    resetCustomStyles: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Provedor de Contexto de Tema.
 * Gerencia a preferência de cor (claro, escuro ou sistema) e persiste no localStorage.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Inicializa o estado do tema buscando no localStorage ou assumindo 'midnight' como padrão
    const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem('irongrid_theme');
        return (saved as Theme) || 'midnight';
    });

    // Custom styles for runtime theme design
    const [customStyles, setCustomStyles] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem('irongrid_custom_styles');
        return saved ? JSON.parse(saved) : {};
    });

    /**
     * Atualiza o tema tanto no estado do React quanto no armazenamento local.
     */
    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('irongrid_theme', newTheme);
    };

    const updateCustomStyle = (key: string, value: string) => {
        setCustomStyles(prev => {
            const newStyles = { ...prev, [key]: value };
            localStorage.setItem('irongrid_custom_styles', JSON.stringify(newStyles));
            return newStyles;
        });
    };

    const applyPresetStyles = (styles: Record<string, string>) => {
        setCustomStyles(styles);
        localStorage.setItem('irongrid_custom_styles', JSON.stringify(styles));
    };

    const resetCustomStyles = () => {
        setCustomStyles({});
        localStorage.removeItem('irongrid_custom_styles');
        const root = window.document.documentElement;
        const tokens = ['surface', 'surface-container', 'on-surface', 'on-surface-variant', 'primary', 'outline-variant'];
        tokens.forEach(t => root.style.removeProperty(`--${t}`));
    };

    /**
     * Efeito para aplicar as classes de CSS no elemento raiz (HTML) 
     * sempre que o tema for alterado.
     */
    useEffect(() => {
        const root = window.document.documentElement;

        const applyTheme = (t: Theme) => {
            root.classList.remove('midnight', 'dark', 'ocean', 'emerald', 'calendar', 'matrix', 'amber', 'synthwave', 'aurora', 'sunfire', 'forest', 'rose');
            root.setAttribute('data-theme', t);
            // Todos os temas são escuros
            root.classList.add(t);
            root.classList.add('dark');
        };

        applyTheme(theme);
    }, [theme]);

    // Apply custom styles
    useEffect(() => {
        const root = window.document.documentElement;
        Object.entries(customStyles).forEach(([key, value]) => {
            // Convert Hex to RGB space separated if it looks like hex
            if (value.startsWith('#')) {
                const r = parseInt(value.slice(1, 3), 16);
                const g = parseInt(value.slice(3, 5), 16);
                const b = parseInt(value.slice(5, 7), 16);
                root.style.setProperty(`--${key}`, `${r} ${g} ${b}`);
            } else {
                root.style.setProperty(`--${key}`, value);
            }
        });
    }, [customStyles]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, customStyles, updateCustomStyle, applyPresetStyles, resetCustomStyles }}>
            {children}
        </ThemeContext.Provider>
    );
}

/**
 * Hook customizado para acessar o contexto de tema de forma simplificada.
 */
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
    }
    return context;
}

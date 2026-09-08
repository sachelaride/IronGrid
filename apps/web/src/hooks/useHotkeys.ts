import { useEffect } from 'react';

type KeyCombo = string; // e.g., 'alt+1', 'ctrl+k'

export function useHotkeys(keyCombo: KeyCombo, callback: (e: KeyboardEvent) => void) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const active = document.activeElement;
            if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || (active instanceof HTMLElement && active.isContentEditable)) {
                return;
            }

            const keys = keyCombo.toLowerCase().split('+');
            const requiresCtrl = keys.includes('ctrl');
            const requiresAlt = keys.includes('alt');
            const requiresShift = keys.includes('shift');
            const requiresMeta = keys.includes('meta');
            const targetKey = keys.filter(k => !['ctrl', 'alt', 'shift', 'meta'].includes(k))[0];

            const keyMatch = e.key.toLowerCase() === targetKey || e.code.toLowerCase() === targetKey;

            if (
                e.ctrlKey === requiresCtrl &&
                e.altKey === requiresAlt &&
                e.shiftKey === requiresShift &&
                e.metaKey === requiresMeta &&
                keyMatch
            ) {
                e.preventDefault();
                callback(e);
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [keyCombo, callback]);
}

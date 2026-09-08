import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from './utils/trpc';
import { httpBatchLink } from '@trpc/client';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

function Root() {
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                httpBatchLink({
                    url: `http://${window.location.hostname}:3001/trpc`,
                    async headers() {
                        const token = localStorage.getItem('irongrid_token');
                        return {
                            authorization: token ? `Bearer ${token}` : undefined,
                        };
                    },
                }),
            ],
        }),
    );

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <LanguageProvider>
                        <App />
                    </LanguageProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </trpc.Provider>
    );
}

const container = document.getElementById('root')!;
const root = (window as any)._reactRoot || ReactDOM.createRoot(container);
(window as any)._reactRoot = root;

root.render(
    // <React.StrictMode>
        <Root />
    // </React.StrictMode>,
);

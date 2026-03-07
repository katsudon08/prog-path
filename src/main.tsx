import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AppProvider } from '@/app/providers';
import { appRouter } from '@/app/router';
import '@/app/index.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AppProvider>
            <RouterProvider router={appRouter} />
        </AppProvider>
    </StrictMode>,
);

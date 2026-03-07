import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/app/layout';
import { HomePage } from '@/pages/home';
import { PlayPage } from '@/pages/play';
import { EditorPage } from '@/pages/editor';

export const appRouter = createBrowserRouter([
    {
        element: <MainLayout />,
        children: [
            {
                path: '/',
                element: <HomePage />,
            },
            {
                path: '/play',
                element: <PlayPage />,
            },
            {
                path: '/editor',
                element: <EditorPage />,
            },
        ],
    },
]);

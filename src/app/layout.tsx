import { Outlet } from 'react-router-dom';

export const MainLayout = () => {
    return (
        <div className="min-h-screen bg-(--color-bg) font-sans flex justify-center">
            <main className="max-w-md w-full min-h-screen bg-(--color-surface) shadow-2xl relative border-x border-gray-100 overflow-x-hidden">
                <Outlet />
            </main>
        </div>
    );
};

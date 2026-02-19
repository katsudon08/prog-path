import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/home';
import { MazeEditorPage } from '@/pages/maze-editor';
import { PlayPage } from '@/pages/play';

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/editor" element={<MazeEditorPage />} />
                <Route path="/play" element={<PlayPage />} />
            </Routes>
        </BrowserRouter>
    );
}

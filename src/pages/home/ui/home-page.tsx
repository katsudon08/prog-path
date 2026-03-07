import { Link } from 'react-router-dom';
import { Play, Grid3x3 } from 'lucide-react';

export const HomePage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 space-y-8">
            <div className="text-center space-y-2 mt-12">
                <h1 className="text-4xl font-extrabold tracking-wider drop-shadow-sm leading-snug">
                    プログラミング
                    <br />
                    <span className="text-(--color-primary)">迷路ゲーム</span>
                </h1>
                <p className="text-(--color-text-muted) font-medium mt-4">
                    QRコードをよみこんで
                    <br />
                    ロボットをうごかそう！
                </p>
            </div>

            <div className="flex flex-col w-full max-w-xs gap-5 mt-12">
                <Link
                    to="/play"
                    className="flex items-center justify-center gap-3 bg-(--color-primary) hover:bg-(--color-primary-dark) text-white text-xl font-bold py-4 px-6 rounded-2xl shadow-[0_4px_0_0_var(--color-primary-dark)] active:shadow-none active:translate-y-1 transition-all"
                >
                    <Play size={28} />
                    あそぶ
                </Link>
                <Link
                    to="/editor"
                    className="flex items-center justify-center gap-3 bg-(--color-secondary) hover:bg-(--color-secondary-dark) text-white text-xl font-bold py-4 px-6 rounded-2xl shadow-[0_4px_0_0_var(--color-secondary-dark)] active:shadow-none active:translate-y-1 transition-all"
                >
                    <Grid3x3 size={28} />
                    つくる
                </Link>
            </div>

            <div className="w-full max-w-xs mt-12 border-2 border-dashed border-gray-300 rounded-xl p-4 bg-white/50">
                <h2 className="text-lg font-bold text-(--color-text-muted) mb-3 text-center">
                    さいきんあそんだ迷路
                </h2>
                <ul className="space-y-3 text-center text-(--color-text-muted) font-medium">
                    <li className="p-3 border-2 border-gray-100 rounded-xl bg-white shadow-sm">
                        はじめてのめいろ
                    </li>
                    <li className="p-3 border-2 border-gray-100 rounded-xl bg-white shadow-sm">
                        ぐるぐるループ
                    </li>
                    <li className="p-2 text-sm text-gray-400">
                        もっと見る...
                    </li>
                </ul>
            </div>
        </div>
    );
};

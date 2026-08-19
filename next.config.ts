import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // 静的HTMLとして書き出す設定
  images: {
    unoptimized: true, // ElectronではNext.jsの画像最適化サーバーが使えないため必須
  },
};

export default nextConfig;

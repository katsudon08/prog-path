import type React from "react";
import type { Metadata } from "next";
import { Orbitron, Michroma } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Head from "next/head"; // next/head をインポート
import "./globals.css";
import { Navbar } from "@/components/navbar";

const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });
const michroma = Michroma({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-michroma",
});

export const metadata: Metadata = {
    title: "ProgPath - AR Programming Learning",
    description: "Learn programming with AR robot maze navigation",
    generator: "v0.app",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja">
            <Head>
                {/* AR.js (three.js版) のスクリプトをCDNから読み込む */}
                {/* 注意: raw.githack.com は開発用です。
                  本番環境では、AR.jsリポジトリからビルド済みの ar.js をダウンロードし、
                  publicフォルダに配置して /ar.js のように参照することを推奨します。
                  camera_para.dat やマーカーファイル (.patt) も同様に public/data/ などに配置します。
                 */}
                <script src="https://raw.githack.com/AR-js-org/AR.js/master/three.js/build/ar.js"></script>
                {/* NFTマーカーを使用する場合はこちらも追加 */}
                {/* <script src="https://raw.githack.com/AR-js-org/AR.js/master/three.js/build/ar-nft.js"></script> */}
            </Head>
            <body
                className={`${orbitron.variable} ${michroma.variable} font-sans antialiased`}
            >
                <Navbar />
                {children}
                <Analytics />
            </body>
        </html>
    );
}
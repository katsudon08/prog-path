import type React from "react";
import type { Metadata } from "next";
import { Orbitron, Michroma } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
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
            <body
                className={`${orbitron.variable} ${michroma.variable} font-sans antialiased`}
            >
                {/* AR.js のために three.js (r128) を読み込む (strategy: beforeInteractive) */}
                <Script
                    src="https://cdnjs.cloudflare.com/ajax/libs/three.js/0.128.0/three.min.js"
                    strategy="beforeInteractive"
                />
                {/* AR.js (THREEx を含む) を読み込む (three.js の後に実行) */}
                <Script
                    src="https://cdn.jsdelivr.net/gh/ar-js-org/AR.js@3.4.5/three.js/build/ar-threex.js"
                    strategy="beforeInteractive"
                />
                <Navbar />
                {children}
                <Analytics />
            </body>
        </html>
    );
}

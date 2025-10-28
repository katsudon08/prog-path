import type React from "react";
import type { Metadata } from "next";
import { Orbitron, Michroma } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
                className={`${orbitron.variable} ${michroma.variable} font-sans antialiased pt-16`}
            >
                <Navbar />
                {children}
                <Analytics />
            </body>
        </html>
    );
}

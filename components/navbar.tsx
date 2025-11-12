"use client";

import { Home, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
    const pathname = usePathname();

    const getPageTitle = () => {
        if (pathname === "/") return "Home";
        if (pathname === "/editor") return "Maze Editor";
        if (pathname?.startsWith("/ar")) return "AR Execution";
        return "ProgPath";
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-neon-blue/30 bg-space-dark/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-neon-cyan transition-colors hover:text-neon-cyan/80"
                    >
                        <Home className="h-5 w-5" />
                    </Link>
                    <span className="text-lg font-bold text-neon-blue">
                        ProgPath
                    </span>
                </div>

                <div className="text-lg font-semibold text-foreground">
                    {getPageTitle()}
                </div>

                <div className="flex items-center">
                    <button className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-neon-blue/10 hover:text-neon-cyan">
                        <User className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </nav>
    );
}

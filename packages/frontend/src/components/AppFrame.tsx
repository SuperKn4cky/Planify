"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";

export default function AppFrame({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const onAuth = pathname?.startsWith("/auth") ?? false;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Sur les pages d'auth, on n'affiche pas le layout avec sidebar
    if (onAuth) {
        return children;
    }

    return (
        <div className="min-h-dvh bg-white">
            <div className="mx-auto flex">
                {/* Sidebar desktop */}
                <div className="hidden md:block">
                    <Sidebar />
                </div>

                {/* Sidebar mobile en overlay */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-40 flex md:hidden">
                        <button
                            type="button"
                            className="absolute inset-0 bg-black/40"
                            onClick={() => setSidebarOpen(false)}
                            aria-label="Fermer le menu de navigation"
                        />
                        <div className="relative z-50 h-dvh w-[260px] bg-[#F5F7F4]">
                            <Sidebar onNavigate={() => setSidebarOpen(false)} />
                        </div>
                    </div>
                )}

                {/* Contenu principal */}
                <main className="flex-1 p-4 text-[#0F172A] md:p-8">
                    {/* Bouton menu visible uniquement en mobile */}
                    <button
                        type="button"
                        className="mb-4 inline-flex items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#0F172A] shadow-sm md:hidden"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Ouvrir le menu de navigation"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    {children}
                </main>
            </div>
        </div>
    );
}

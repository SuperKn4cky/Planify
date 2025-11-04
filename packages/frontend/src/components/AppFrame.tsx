"use client";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function AppFrame({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const onAuth = pathname?.startsWith("/auth") ?? false;

    if (onAuth) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-dvh bg-white">
            <div className="mx-auto flex">
                <Sidebar />
                <main className="flex-1 p-8 text-[#0F172A]">{children}</main>
            </div>
        </div>
    );
}

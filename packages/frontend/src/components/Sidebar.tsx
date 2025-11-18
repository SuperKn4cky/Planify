"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { FileCheck, Users, User, LogOut } from "lucide-react";
import logo from "@/../public/planify.png";

type Item = {
    href: string;
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const top: Item[] = [
    { href: "/dashboard", label: "Tâches", icon: FileCheck },
    { href: "/contacts", label: "Contacts", icon: Users },
];

const bottomConnected: Item[] = [
    { href: "/account", label: "Compte", icon: User },
];

const bottomGuest: Item[] = [
    { href: "/auth/login", label: "Connexion", icon: User },
    { href: "/auth/register", label: "Inscription", icon: User },
];

function NavLink({ item, active }: { item: Item; active: boolean }) {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            className={[
                "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                "text-[#0F172A]",
                active ? "bg-[#ECEFED]" : "bg-transparent hover:bg-[#ECEFED]",
            ].join(" ")}
        >
            <Icon className="h-[28px] w-[28px] stroke-[1.8] text-[#0F172A]" />
            <span className="text-[16px] leading-6">{item.label}</span>
        </Link>
    );
}

export default function Sidebar() {
    const pathname = usePathname();
    const { isAuthenticated, logout } = useAuth();

    const bottomItems = isAuthenticated ? bottomConnected : bottomGuest;

    return (
        <aside
            className="flex h-dvh w-[260px] flex-col justify-between bg-[#F5F7F4] px-6 py-8"
            aria-label="Navigation principale"
        >
            {/* Marque + liens du haut */}
            <div>
                <div className="-mx-6">
                    <Image
                        src={logo}
                        alt="Planify"
                        width={160}
                        height={40}
                        priority
                        className="w-full h-auto select-none"
                        sizes="212px"
                    />
                </div>

                <nav className="mt-10 space-y-4">
                    {top.map((it) => (
                        <NavLink
                            key={it.href}
                            item={it}
                            active={pathname?.startsWith(it.href) ?? false}
                        />
                    ))}
                </nav>
            </div>

            {/* Bas de sidebar : compte / auth + logout */}
            <div>
                <div className="pb-2 space-y-4">
                    {bottomItems.map((it) => (
                        <NavLink
                            key={it.href}
                            item={it}
                            active={pathname?.startsWith(it.href) ?? false}
                        />
                    ))}
                </div>

                {isAuthenticated && (
                    <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[#0F172A] hover:bg-[#ECEFED] transition-colors"
                    >
                        <LogOut className="h-[28px] w-[28px] stroke-[1.8] text-[#0F172A]" />
                        <span className="text-[16px] leading-6">
                            Déconnexion
                        </span>
                    </button>
                )}
            </div>
        </aside>
    );
}

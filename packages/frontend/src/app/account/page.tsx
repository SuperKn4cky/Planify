"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, User as UserIcon, LogOut, Trash2 } from "lucide-react";
import { getJSON, putJSON } from "@/lib/api";
import { accountSchema } from "@/features/auth/validation";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Me = { email: string; first_name: string; last_name: string };
type UpdateRes = { message?: string; data?: Me };

export default function AccountPage() {
    const router = useRouter();
    const { deleteAccount } = useAuth();
    const [form, setForm] = useState<Me>({
        email: "",
        first_name: "",
        last_name: "",
    });
    const [loadingSave, setLoadingSave] = useState(false);
    const [loadingLogoutAll, setLoadingLogoutAll] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [openLogout, setOpenLogout] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);

    useEffect(() => {
        getJSON<Me>("api/users/me")
            .then((me) =>
                setForm({
                    email: me.email ?? "",
                    first_name: me.first_name ?? "",
                    last_name: me.last_name ?? "",
                }),
            )
            .catch(() => router.push("/auth/login"));
    }, [router]);

    function onChange<K extends keyof Me>(key: K, value: Me[K]) {
        setError(null);
        setSuccess(null);
        setForm((f) => ({ ...f, [key]: value }));
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        const parsed = accountSchema.safeParse(form);
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? "Champs invalides.");
            return;
        }
        try {
            setLoadingSave(true);
            const res = await putJSON<UpdateRes>("api/users/me", parsed.data);
            setSuccess("Profil mis à jour.");
        } catch (err) {
            if (
                err instanceof Error &&
                err.message === "This email is already in use."
            ) {
                setError("Cet email est déjà utilisé.");
                return;
            }
            setError("Une erreur inattendue est survenue.");
        } finally {
            setLoadingSave(false);
        }
    }

    async function logoutAll() {
        setError(null);
        setSuccess(null);
        try {
            setLoadingLogoutAll(true);
            const res = await fetch("api/auth/logout-all", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(
                    body?.error ?? body?.message ?? `Erreur ${res.status}`,
                );
            }
            router.push("/auth/login");
            router.refresh();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Une erreur inattendue est survenue.",
            );
        } finally {
            setLoadingLogoutAll(false);
        }
    }

    return (
        <div className="mx-auto max-w-xl py-8 text-[#0F172A]">
            <h1 className="text-3xl font-semibold text-[#0F172A]">
                Mon compte
            </h1>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
                <div className="relative">
                    <label
                        htmlFor="firstname"
                        className="absolute left-2 -top-2 bg-white px-1 text-sm text-[#6B7280] transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-sm peer-focus:text-[#2D6AE3]"
                    >
                        Prénom
                    </label>
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]">
                        <UserIcon className="h-5 w-5" />
                    </div>
                    <input
                        id="firstname"
                        value={form.first_name}
                        onChange={(e) => onChange("first_name", e.target.value)}
                        placeholder=" "
                        className="peer w-full h-11 rounded-lg border border-[#E5E7EB] pl-10 pr-3 text-base text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D6AE3]"
                    />
                </div>

                <div className="relative">
                    <label
                        htmlFor="lastname"
                        className="absolute left-2 -top-2 bg-white px-1 text-sm text-[#6B7280] transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-sm peer-focus:text-[#2D6AE3]"
                    >
                        Nom
                    </label>
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]">
                        <UserIcon className="h-5 w-5" />
                    </div>
                    <input
                        id="lastname"
                        value={form.last_name}
                        onChange={(e) => onChange("last_name", e.target.value)}
                        placeholder=" "
                        className="peer w-full h-11 rounded-lg border border-[#E5E7EB] pl-10 pr-3 text-base text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D6AE3]"
                    />
                </div>

                <div className="relative">
                    <label
                        htmlFor="email"
                        className="absolute left-2 -top-2 bg-white px-1 text-sm text-[#6B7280] transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-sm peer-focus:text-[#2D6AE3]"
                    >
                        Email
                    </label>
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]">
                        <Mail className="h-5 w-5" />
                    </div>
                    <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => onChange("email", e.target.value)}
                        placeholder=" "
                        className="peer w-full h-11 rounded-lg border border-[#E5E7EB] pl-10 pr-3 text-base text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D6AE3]"
                    />
                </div>

                {error && (
                    <div
                        id="form-error"
                        role="alert"
                        className="text-sm text-[#B91C1C]"
                    >
                        {error}
                    </div>
                )}
                {success && (
                    <div role="status" className="text-sm text-[#16A34A]">
                        {success}
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={loadingSave}
                        className="h-11 flex-1 rounded-lg bg-[#2563EB] text-white text-[15px] font-medium hover:bg-[#1D4ED8] disabled:opacity-60"
                    >
                        {loadingSave ? "Enregistrement..." : "Enregistrer"}
                    </button>
                </div>
            </form>

            <div className="mt-10 space-y-3">
                <button
                    type="button"
                    onClick={() => setOpenLogout(true)}
                    disabled={loadingLogoutAll}
                    className="flex w-full items-center gap-3 rounded-md border border-[#E5E7EB] px-3 py-2 text-left text-[#0F172A] hover:bg-[#ECEFED] transition-colors"
                >
                    <LogOut className="h-[28px] w-[28px] stroke-[1.8] text-[#0F172A]" />
                    <span className="text-[16px] leading-6">
                        {loadingLogoutAll
                            ? "Déconnexion..."
                            : "Déconnecter tous les appareils"}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setOpenDelete(true)}
                    className="flex w-full items-center gap-3 rounded-md border border-[#E5E7EB] px-3 py-2 text-left text-[#0F172A] hover:bg-[#ECEFED] transition-colors"
                >
                    <Trash2 className="h-[28px] w-[28px] stroke-[1.8] text-[#0F172A]" />
                    <span className="text-[16px] leading-6">
                        Supprimer mon compte
                    </span>
                </button>

                <ConfirmDialog
                    open={openLogout}
                    onClose={() => setOpenLogout(false)}
                    onConfirm={() => {
                        setOpenLogout(false);
                        logoutAll();
                    }}
                    title="Déconnecter tous les appareils ?"
                    description="Tu seras déconnecté(e) de toutes les sessions actives immédiatement."
                    confirmLabel="Déconnecter"
                    cancelLabel="Annuler"
                />

                <ConfirmDialog
                    open={openDelete}
                    onClose={() => setOpenDelete(false)}
                    onConfirm={() => {
                        setOpenDelete(false);
                        deleteAccount();
                    }}
                    title="Supprimer ton compte ?"
                    description="Cette action est définitive et supprimera toutes tes données."
                    confirmLabel="Supprimer"
                    cancelLabel="Annuler"
                    tone="danger"
                />
            </div>
        </div>
    );
}

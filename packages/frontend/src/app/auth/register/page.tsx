"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { postJSON } from "@/lib/api";
import { registerSchema } from "@/features/auth/validation";
import { Eye, EyeOff } from "lucide-react";
import logo from "@/../public/planify.png";

type RegisterResponse = {
    message?: string;
    data?: { email: string; first_name: string; last_name: string };
};

export default function RegisterPage() {
    const router = useRouter();
    const [first_name, setFirst] = useState("");
    const [last_name, setLast] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPwd] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const parsed = registerSchema.safeParse({
            first_name,
            last_name,
            email,
            password,
            confirm,
        });
        if (!parsed.success) {
            const first =
                parsed.error.issues[0]?.message ?? "Champs invalides.";
            setError(first);
            return;
        }

        try {
            setLoading(true);
            await postJSON<RegisterResponse>("/auth/register", {
                first_name,
                last_name,
                email,
                password,
            });
            router.push("/");
        } catch (err: unknown) {
            if (
                err instanceof Error &&
                err.message === "This email is already in use."
            ) {
                setError("Cet email est déjà utilisé.");
            } else if (err instanceof Error) {
                setError(
                    "Une erreur inattendue est survenue." + "\n" + err.message,
                );
            } else {
                setError("Une erreur inattendue est survenue.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
            <div className="w-full max-w-[440px]">
                {/* En-tête: lockup image + sous-titre */}
                <div className="relative mb-8">
                    <Image
                        src={logo}
                        alt="Planify"
                        width={440}
                        height={96}
                        priority
                        sizes="440px"
                        className="w-full h-auto"
                    />
                    <h1 className="absolute bottom-[2rem] left-1/2 w-full -translate-x-1/2 text-center text-2xl font-semibold text-gray-800">
                        Créer votre compte
                    </h1>
                </div>

                {/* Formulaire */}
                <form onSubmit={onSubmit} className="rounded-xl">
                    {/* Prénom */}
                    <div className="relative mb-4">
                        <label
                            htmlFor="first_name"
                            className="absolute left-2 -top-2 bg-white px-1 text-sm text-[#6B7280] transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#2D6AE3]"
                        >
                            Prénom
                        </label>
                        <input
                            id="first_name"
                            placeholder=" "
                            value={first_name}
                            onChange={(e) => setFirst(e.target.value)}
                            className="peer w-full h-11 rounded-lg border border-[#E5E7EB] px-3 text-base text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D6AE3]"
                        />
                    </div>

                    {/* Nom */}
                    <div className="relative mb-4">
                        <label
                            htmlFor="last_name"
                            className="absolute left-2 -top-2 bg-white px-1 text-sm text-[#6B7280] transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#2D6AE3]"
                        >
                            Nom
                        </label>
                        <input
                            id="last_name"
                            placeholder=" "
                            value={last_name}
                            onChange={(e) => setLast(e.target.value)}
                            className="peer w-full h-11 rounded-lg border border-[#E5E7EB] px-3 text-base text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D6AE3]"
                        />
                    </div>

                    {/* Email */}
                    <div className="relative mb-4">
                        <label
                            htmlFor="email"
                            className="absolute left-2 -top-2 bg-white px-1 text-sm text-[#6B7280] transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#2D6AE3]"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            placeholder=" "
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="peer w-full h-11 rounded-lg border border-[#E5E7EB] px-3 text-base text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D6AE3]"
                        />
                    </div>

                    {/* Mot de passe */}
                    <div className="relative mb-4">
                        <label
                            htmlFor="password"
                            className="absolute left-2 -top-2 bg-white px-1 text-sm text-[#6B7280] transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#2D6AE3]"
                        >
                            Mot de passe
                        </label>
                        <input
                            id="password"
                            type={showPwd ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder=" "
                            value={password}
                            onChange={(e) => setPwd(e.target.value)}
                            className="peer w-full h-11 rounded-lg border border-[#E5E7EB] px-3 pr-10 text-base text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D6AE3]"
                        />
                        <button
                            type="button"
                            aria-label={
                                showPwd
                                    ? "Masquer le mot de passe"
                                    : "Afficher le mot de passe"
                            }
                            onClick={() => setShowPwd((v) => !v)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#6B7280] hover:text-[#374151]"
                        >
                            {showPwd ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>

                    {/* Confirmation */}
                    <div className="relative mb-1">
                        <label
                            htmlFor="confirm"
                            className="absolute left-2 -top-2 bg-white px-1 text-sm text-[#6B7280] transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#2D6AE3]"
                        >
                            Confirmer le mot de passe
                        </label>
                        <input
                            id="confirm"
                            type={showConfirm ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder=" "
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            className="peer w-full h-11 rounded-lg border border-[#E5E7EB] px-3 pr-10 text-base text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D6AE3]"
                        />
                        <button
                            type="button"
                            aria-label={
                                showConfirm
                                    ? "Masquer la confirmation"
                                    : "Afficher la confirmation"
                            }
                            onClick={() => setShowConfirm((v) => !v)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#6B7280] hover:text-[#374151]"
                        >
                            {showConfirm ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>

                    {/* Lien vers login */}
                    <div className="mt-2 text-right text-sm text-[#6B7280]">
                        Déjà un compte ?{" "}
                        <a
                            href="/auth/login"
                            className="text-sm text-[#2D6AE3] hover:underline"
                        >
                            Se connecter
                        </a>
                    </div>

                    {/* Erreur */}
                    {error && (
                        <div
                            id="form-error"
                            role="alert"
                            className="mt-3 text-sm text-[#B91C1C]"
                        >
                            {error}
                        </div>
                    )}

                    {/* CTA */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-5 w-full h-11 rounded-lg bg-[#2563EB] text-white text-[15px] font-medium hover:bg-[#1D4ED8] disabled:opacity-60"
                    >
                        {loading ? "Création en cours..." : "Créer le compte"}
                    </button>
                </form>
            </div>
        </div>
    );
}

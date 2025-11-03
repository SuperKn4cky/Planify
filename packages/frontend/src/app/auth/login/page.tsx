"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { postJSON } from "@/lib/api";
import { loginSchema } from "@/features/auth/validation";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type LoginResponse = { message?: string };

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? "Champs invalides.";
      setError(first);
      return;
    }

    try {
      setLoading(true);
      await postJSON<LoginResponse>("/auth/login", { email, password });
      login();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Une erreur inattendue est survenue.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white">
      {/* En-tête: Logo + Titre superposé */}
      <div className="relative mb-8">
        <Image
          src="/planify.png"
          alt="Planify"
          width={440}
          height={96}
          priority
          sizes="440px"
          className="w-full h-auto"
        />
        <h1 className="absolute bottom-[2rem] left-1/2 w-full -translate-x-1/2 text-center text-2xl font-semibold text-gray-800">
          Connexion à votre compte
        </h1>
      </div>

      {/* Formulaire */}
      <form onSubmit={onSubmit} className="rounded-xl">
        <div className="relative mb-4">
          <label
            htmlFor="email"
            className="absolute left-2 -top-2 scale-100 bg-white px-1 text-sm text-[#6B7280] transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-base peer-focus:-top-2 peer-focus:scale-100 peer-focus:text-sm peer-focus:text-[#2D6AE3]"
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

        <div className="relative mb-2">
          <label
            htmlFor="password"
            className="absolute left-2 -top-2 scale-100 bg-white px-1 text-sm text-[#6B7280] transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-base peer-focus:-top-2 peer-focus:scale-100 peer-focus:text-sm peer-focus:text-[#2D6AE3]"
          >
            Mot de passe
          </label>
          <input
            id="password"
            type={showPwd ? "text" : "password"}
            autoComplete="current-password"
            placeholder=" "
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="peer w-full h-11 rounded-lg border border-[#E5E7EB] px-3 pr-10 text-base text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D6AE3]"
          />
          <button
            type="button"
            aria-label={
              showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"
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

        <div className="text-right">
          <a
            href="/forgot-password"
            className="text-sm text-[#2D6AE3] hover:underline"
          >
            Mot de passe oublié ?
          </a>
        </div>

        {error && (
          <div
            id="form-error"
            role="alert"
            className="mt-3 text-sm text-[#B91C1C]"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full h-11 rounded-lg bg-[#2563EB] text-white text-[15px] font-medium hover:bg-[#1D4ED8] disabled:opacity-60"
        >
          {loading ? "Connexion..." : "Connexion"}
        </button>

        <div className="mt-3 text-center text-sm text-[#6B7280]">
          Vous n&apos;avez pas de compte ?{" "}
          <a href="/auth/register" className="text-[#2D6AE3] hover:underline">
            Créer un compte
          </a>
        </div>
      </form>
    </div>
  );
}

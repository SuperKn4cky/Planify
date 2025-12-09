"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { postJSON } from "@/lib/api";
import { ApiError } from "@/lib/api";

export default function AcceptContactPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token manquant dans l'URL.");
      return;
    }

    async function acceptInvitation() {
      try {
        await postJSON<{ message: string; data: any }>("/api/contacts/accept", { token });
        setStatus("success");
        setMessage("Contact ajouté avec succès !");
        // Redirection après 2 secondes
        setTimeout(() => router.push("/contacts"), 2000);
      } catch (err) {
        setStatus("error");
        if (err instanceof ApiError) {
          setMessage(err.message);
        } else {
          setMessage("Une erreur inattendue est survenue.");
        }
      }
    }

    acceptInvitation();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center">
        {status === "loading" && (
          <div>
            <h1 className="text-2xl font-semibold text-0F172A mb-4">
              Validation en cours...
            </h1>
            <p className="text-6B7280">Veuillez patienter pendant que nous ajoutons ce contact.</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <h1 className="text-2xl font-semibold text-16A34A mb-4">
              ✓ Contact ajouté !
            </h1>
            <p className="text-6B7280">{message}</p>
            <p className="text-sm text-6B7280 mt-2">
              Redirection vers vos contacts...
            </p>
          </div>
        )}

        {status === "error" && (
          <div>
            <h1 className="text-2xl font-semibold text-B91C1C mb-4">
              Erreur
            </h1>
            <p className="text-6B7280">{message}</p>
            <button
              onClick={() => router.push("/contacts")}
              className="mt-6 h-10 rounded-lg bg-2563EB px-4 text-white hover:bg-1D4ED8"
            >
              Retour aux contacts
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

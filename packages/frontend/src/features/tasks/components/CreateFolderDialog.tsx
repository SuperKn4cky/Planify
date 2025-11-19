"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ApiError } from "@/lib/api";

type CreateFolderDialogProps = {
    open: boolean;
    onClose: () => void;
    onCreate: (name: string) => Promise<void>;
};

export function CreateFolderDialog({
    open,
    onClose,
    onCreate,
}: CreateFolderDialogProps) {
    const nameInputRef = useRef<HTMLInputElement | null>(null);
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        if (open) {
            document.addEventListener("keydown", onKey);
            requestAnimationFrame(() => nameInputRef.current?.focus());
            document.body.style.overflow = "hidden";
            setName("");
            setError(null);
            setApiError(null);
        }
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setApiError(null);

        const trimmed = name.trim();
        if (!trimmed) {
            setError("Le nom du dossier est obligatoire.");
            return;
        }

        try {
            await onCreate(trimmed);
        } catch (err) {
            if (err instanceof ApiError) {
                setApiError(err.message);
            } else {
                setApiError("Une erreur inattendue est survenue.");
            }
        }
    }

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-folder-dialog-title"
        >
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-hidden="true"
            />
            <form
                onSubmit={handleSubmit}
                className="relative w-full max-w-md rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xl text-[#0F172A]"
                noValidate
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-3 rounded-md p-1 text-[#0F172A] hover:bg-[#ECEFED]"
                    aria-label="Fermer"
                >
                    <X className="h-5 w-5" />
                </button>

                <h2
                    id="create-folder-dialog-title"
                    className="text-lg font-semibold text-[#0F172A]"
                >
                    Nouveau dossier
                </h2>

                <div className="mt-4 space-y-4">
                    <div>
                        <label
                            htmlFor="folder-name"
                            className="block text-sm font-medium text-[#6B7280]"
                        >
                            Nom du dossier
                        </label>
                        <input
                            ref={nameInputRef}
                            id="folder-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 h-11 w-full rounded-lg border border-[#E5E7EB] px-3 text-base text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D6AE3]"
                        />
                        {error && (
                            <p className="mt-1 text-sm text-red-600">{error}</p>
                        )}
                    </div>

                    {apiError && (
                        <p className="mt-1 text-sm text-red-600">{apiError}</p>
                    )}
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-10 rounded-lg border border-[#E5E7EB] px-4 text-[15px] text-[#0F172A] hover:bg-[#ECEFED]"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className="h-10 rounded-lg bg-[#2563EB] px-4 text-[15px] font-medium text-white hover:bg-[#1D4ED8]"
                    >
                        Créer
                    </button>
                </div>
            </form>
        </div>,
        document.body,
    );
}

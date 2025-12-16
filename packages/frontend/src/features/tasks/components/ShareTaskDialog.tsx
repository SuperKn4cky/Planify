"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { ApiError } from "@/lib/api";
import {
    listContacts,
    listTaskShares,
    revokeTaskShare,
    shareTask,
} from "@/features/tasks/api";
import type { Contact, TaskShareRow } from "@/features/tasks/types";

type Props = {
    open: boolean;
    taskId: number;
    onClose: () => void;
};

function asArray<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value;
    if (
        value &&
        typeof value === "object" &&
        Array.isArray((value as any).data)
    ) {
        return (value as any).data;
    }
    return [];
}

export default function ShareTaskDialog({ open, taskId, onClose }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [shares, setShares] = useState<TaskShareRow[]>([]);

    const [selectedContactId, setSelectedContactId] = useState<number | "none">(
        "none",
    );
    const [permission, setPermission] = useState<"read" | "write">("read");

    const sharedIds = useMemo(() => new Set(shares.map((s) => s.id)), [shares]);

    async function refresh() {
        setLoading(true);
        setError(null);
        try {
            const [cRaw, sRaw] = await Promise.all([
                listContacts(),
                listTaskShares(taskId),
            ]);
            const c = asArray<Contact>(cRaw);
            const s = asArray<TaskShareRow>(sRaw);

            if (c.length === 0 && !Array.isArray(cRaw)) {
                throw new ApiError(
                    "Format invalide: /contacts n'a pas renvoyé un tableau.",
                    500,
                );
            }
            if (s.length === 0 && !Array.isArray(sRaw)) {
                throw new ApiError(
                    "Format invalide: /tasks/:id/shares n'a pas renvoyé un tableau.",
                    500,
                );
            }

            setContacts(c);
            setShares(s);
        } catch (e) {
            setError(
                e instanceof ApiError
                    ? e.message
                    : "Impossible de charger les données.",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!open) return;
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, taskId]);

    async function onAdd() {
        setError(null);
        if (selectedContactId === "none") {
            setError("Choisis un contact.");
            return;
        }
        try {
            await shareTask(taskId, selectedContactId, permission);
            setSelectedContactId("none");
            await refresh();
        } catch (e) {
            setError(
                e instanceof ApiError
                    ? e.message
                    : "Impossible de partager la tâche.",
            );
        }
    }

    async function onRevoke(userId: number) {
        setError(null);
        try {
            await revokeTaskShare(taskId, userId);
            await refresh();
        } catch (e) {
            setError(
                e instanceof ApiError
                    ? e.message
                    : "Impossible de révoquer le partage.",
            );
        }
    }

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
        >
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-hidden="true"
            />

            <div className="relative w-full max-w-xl rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xl text-[#0F172A]">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-3 rounded-md p-1 text-[#0F172A] hover:bg-[#ECEFED]"
                    aria-label="Fermer"
                >
                    <X className="h-5 w-5" />
                </button>

                <h2 className="text-lg font-semibold">Partager la tâche</h2>

                {error ? (
                    <p className="mt-3 text-sm text-red-600">{error}</p>
                ) : null}

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                        value={
                            selectedContactId === "none"
                                ? "none"
                                : String(selectedContactId)
                        }
                        onChange={(e) =>
                            setSelectedContactId(
                                e.target.value === "none"
                                    ? "none"
                                    : Number(e.target.value),
                            )
                        }
                        className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[15px]"
                    >
                        <option value="none">Choisir un contact…</option>
                        {contacts.map((c) => (
                            <option
                                key={c.id}
                                value={c.id}
                                disabled={sharedIds.has(c.id)}
                            >
                                {c.first_name} {c.last_name} ({c.email})
                                {sharedIds.has(c.id) ? " — déjà partagé" : ""}
                            </option>
                        ))}
                    </select>

                    <select
                        value={permission}
                        onChange={(e) =>
                            setPermission(e.target.value as "read" | "write")
                        }
                        className="h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[15px]"
                    >
                        <option value="read">Lecture</option>
                        <option value="write">Écriture</option>
                    </select>

                    <button
                        type="button"
                        onClick={onAdd}
                        disabled={loading}
                        className="h-10 rounded-lg bg-[#2563EB] px-4 text-[15px] font-medium text-white hover:bg-[#1D4ED8] disabled:opacity-50"
                    >
                        Ajouter
                    </button>
                </div>

                <div className="mt-5">
                    {loading ? (
                        <p className="text-sm text-[#6B7280]">Chargement…</p>
                    ) : shares.length === 0 ? (
                        <p className="text-sm text-[#6B7280]">
                            Aucun partage pour le moment.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {shares.map((s) => (
                                <li
                                    key={s.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-[#E5E7EB] p-3"
                                >
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-medium">
                                            {s.first_name} {s.last_name} (
                                            {s.email})
                                        </div>
                                        <div className="text-xs text-[#6B7280]">
                                            Permission: {s.permission}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => onRevoke(s.id)}
                                        className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm hover:bg-[#ECEFED] disabled:opacity-50"
                                        disabled={s.permission === "owner"}
                                    >
                                        Révoquer
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

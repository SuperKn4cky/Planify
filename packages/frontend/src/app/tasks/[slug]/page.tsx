"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import type { TaskPriority, TaskStatus } from "@/features/tasks/types";
import { taskSchema } from "@/features/tasks/validation";
import { ApiError, getJSON, postJSON, delJSON, putJSON } from "@/lib/api";

type Task = {
    id: number;
    title: string;
    description: string | null;
    duedate: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    folderid: number | null;
    responsibleuser: number | null;
};

function parseSlug(slug: string): number {
    const idPart = slug.split("-")[0];
    const id = Number.parseInt(idPart, 10);
    if (!Number.isFinite(id) || id <= 0) {
        throw new Error("Invalid task slug");
    }
    return id;
}

export default function TaskEditPage() {
    const params = useParams<{ slug: string }>();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<TaskStatus>("todo");
    const [priority, setPriority] = useState<TaskPriority>(2);
    const [duedate, setDuedate] = useState<string>("");

    const [errors, setErrors] = useState<Record<string, string | undefined>>(
        {},
    );

    useEffect(() => {
        if (!params?.slug) return;
        const id = parseSlug(params.slug);

        let aborted = false;

        async function loadTask() {
            try {
                setLoading(true);
                setApiError(null);

                // Option : réserver la tâche pour édition (si tu ajoutes /tasks/:id/editing côté backend)
                try {
                    await postJSON(`api/tasks/${id}/editing`);
                } catch (err) {
                    if (err instanceof ApiError && err.status === 409) {
                        setApiError(
                            "Cette tâche est en cours de modification par un autre utilisateur.",
                        );
                        return;
                    }
                    // autre erreur: on continue, mais on affiche un message
                    console.error(err);
                }

                const res = await getJSON<{ data: Task }>(`api/tasks/${id}`);

                if (aborted) return;

                const t = res.data;
                setTitle(t.title);
                setDescription(t.description ?? "");
                setStatus(t.status);
                setPriority(t.priority);
                setDuedate(
                    t.duedate
                        ? new Date(t.duedate).toISOString().slice(0, 10)
                        : "",
                );
            } catch (err) {
                if (aborted) return;
                console.error(err);
                setApiError(
                    err instanceof ApiError
                        ? err.message
                        : "Impossible de charger la tâche.",
                );
            } finally {
                if (!aborted) setLoading(false);
            }
        }

        loadTask();

        return () => {
            aborted = true;
            // Best effort : libérer le lock si la route /tasks/:id/editing existe
            const idCleanup = (() => {
                try {
                    return parseSlug(params.slug);
                } catch {
                    return null;
                }
            })();
            if (idCleanup) {
                delJSON(`api/tasks/${idCleanup}/editing`).catch(() => {});
            }
        };
    }, [params?.slug]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setApiError(null);
        setErrors({});

        const result = taskSchema.safeParse({
            title,
            description,
            status,
            priority,
            duedate: duedate || undefined,
        });

        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            for (const issue of result.error.issues) {
                const path = issue.path[0];
                if (typeof path === "string") {
                    fieldErrors[path] = issue.message;
                }
            }
            setErrors(fieldErrors);
            return;
        }

        const id = parseSlug(params.slug);

        try {
            setSaving(true);
            await putJSON(`api/tasks/${id}`, {
                title,
                description,
                status,
                priority,
                duedate: duedate || null,
            });

            // Libérer le lock si possible
            delJSON(`api/tasks/${id}/editing`).catch(() => {});

            router.push("/dashboard");
        } catch (err) {
            console.error(err);
            if (err instanceof ApiError) {
                setApiError(err.message);
            } else {
                setApiError("Impossible de sauvegarder la tâche.");
            }
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-3xl py-8 text-[#6B7280]">
                Chargement de la tâche…
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl py-8 text-[#0F172A]">
            <h1 className="text-2xl font-semibold">Modifier la tâche</h1>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                <div>
                    <label
                        htmlFor="task-title"
                        className="block text-sm font-medium text-[#6B7280]"
                    >
                        Titre
                    </label>
                    <input
                        id="task-title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-1 h-11 w-full rounded-lg border border-[#E5E7EB] px-3 text-base text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D6AE3]"
                    />
                    {errors.title && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.title}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="task-description"
                        className="block text-sm font-medium text-[#6B7280]"
                    >
                        Description
                    </label>
                    <textarea
                        id="task-description"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-base text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D6AE3]"
                    />
                    {errors.description && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.description}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                        <label
                            htmlFor="task-status"
                            className="block text-sm font-medium text-[#6B7280]"
                        >
                            Statut
                        </label>
                        <select
                            id="task-status"
                            value={status}
                            onChange={(e) =>
                                setStatus(e.target.value as TaskStatus)
                            }
                            className="mt-1 h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[15px]"
                        >
                            <option value="todo">À faire</option>
                            <option value="doing">En cours</option>
                            <option value="done">Terminée</option>
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="task-priority"
                            className="block text-sm font-medium text-[#6B7280]"
                        >
                            Priorité
                        </label>
                        <select
                            id="task-priority"
                            value={priority}
                            onChange={(e) =>
                                setPriority(
                                    Number(e.target.value) as TaskPriority,
                                )
                            }
                            className="mt-1 h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[15px]"
                        >
                            <option value={1}>Faible</option>
                            <option value={2}>Moyenne</option>
                            <option value={3}>Élevée</option>
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="task-due-date"
                            className="block text-sm font-medium text-[#6B7280]"
                        >
                            Date d’échéance
                        </label>
                        <div className="mt-1 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[#6B7280]" />
                            <input
                                id="task-due-date"
                                type="date"
                                value={duedate}
                                onChange={(e) => setDuedate(e.target.value)}
                                className="h-10 flex-1 rounded-lg border border-[#E5E7EB] px-3 text-base text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D6AE3]"
                            />
                        </div>
                        {errors.duedate && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.duedate}
                            </p>
                        )}
                    </div>
                </div>

                {apiError && (
                    <p className="mt-2 text-sm text-red-600">{apiError}</p>
                )}

                <div className="mt-5 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.push("/dashboard")}
                        className="h-10 rounded-lg border border-[#E5E7EB] px-4 text-[15px] text-[#0F172A] hover:bg-[#ECEFED]"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="h-10 rounded-lg bg-[#2563EB] px-4 text-[15px] font-medium text-white hover:bg-[#1D4ED8] disabled:opacity-50"
                    >
                        {saving ? "Enregistrement…" : "Enregistrer"}
                    </button>
                </div>
            </form>
        </div>
    );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { TaskPriority, TaskStatus } from "@/features/tasks/types";
import { taskSchema } from "@/features/tasks/validation";
import { ApiError } from "@/lib/api";

type CreateTaskDialogProps = {
    open: boolean;
    onClose: () => void;
    onCreate: (data: {
        title: string;
        description: string;
        status: TaskStatus;
        priority: TaskPriority;
        due_date?: string;
        folder_id?: number | null;
    }) => Promise<void>;
    folders: Array<{ id: number; name: string }>;
    defaultFolderId?: number | "all" | "none";
};

export function CreateTaskDialog({
    open,
    onClose,
    onCreate,
    folders,
    defaultFolderId,
}: CreateTaskDialogProps) {
    const titleInputRef = useRef<HTMLInputElement | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<TaskStatus>("todo");
    const [priority, setPriority] = useState<TaskPriority>(2);
    const [due_date, setDueDate] = useState("");
    const [folderId, setFolderId] = useState<number | "none">("none");
    const [errors, setErrors] = useState<Record<string, string | undefined>>(
        {},
    );
    const [apiError, setApiError] = useState<string | null>(null);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        if (open) {
            document.addEventListener("keydown", onKey);
            requestAnimationFrame(() => titleInputRef.current?.focus());
            document.body.style.overflow = "hidden";
            setTitle("");
            setDescription("");
            setStatus("todo");
            setPriority(2);
            setDueDate("");
            setErrors({});
            setApiError(null);

            const initialFolder =
                defaultFolderId && defaultFolderId !== "all"
                    ? defaultFolderId
                    : "none";
            setFolderId(initialFolder);
        }
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setApiError(null);
        setErrors({});

        const result = taskSchema.safeParse({
            title,
            description,
            status,
            priority,
            due_date: due_date || undefined,
        });

        if (!result.success) {
            const newErrors: Record<string, string | undefined> = {};
            result.error.issues.forEach((issue) => {
                newErrors[String(issue.path[0])] = issue.message;
            });
            setErrors(newErrors);
            return;
        }

        try {
            const payload = {
                ...result.data,
                folder_id: folderId === "none" ? null : folderId,
            };
            await onCreate(payload as any);
        } catch (err: unknown) {
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
            aria-labelledby="create-task-dialog-title"
        >
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-hidden="true"
            />
            <form
                onSubmit={handleSubmit}
                className="relative w-full max-w-lg rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xl text-[#0F172A]"
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
                    id="create-task-dialog-title"
                    className="text-lg font-semibold text-[#0F172A]"
                >
                    Nouvelle tâche
                </h2>

                <div className="mt-4 space-y-4">
                    <div>
                        <label
                            htmlFor="task-title"
                            className="block text-sm font-medium text-[#6B7280]"
                        >
                            Titre
                        </label>
                        <input
                            ref={titleInputRef}
                            id="task-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 w-full h-11 rounded-lg border border-[#E5E7EB] pl-3 pr-3 text-base text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D6AE3]"
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
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="mt-1 w-full rounded-lg border border-[#E5E7EB] pl-3 pr-3 py-2 text-base text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D6AE3]"
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
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
                                className="mt-1 h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-15px"
                            >
                                <option value="todo">À faire</option>
                                <option value="doing">En cours</option>
                                <option value="done">Terminé</option>
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
                                className="mt-1 h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-15px"
                            >
                                <option value={1}>Faible</option>
                                <option value={2}>Moyenne</option>
                                <option value={3}>Élevée</option>
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="task-folder"
                                className="block text-sm font-medium text-[#6B7280]"
                            >
                                Dossier
                            </label>
                            <select
                                id="task-folder"
                                value={
                                    folderId === "none"
                                        ? "none"
                                        : String(folderId)
                                }
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setFolderId(
                                        v === "none" ? "none" : Number(v),
                                    );
                                }}
                                className="mt-1 h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-15px"
                            >
                                <option value="none">Aucun dossier</option>
                                {folders.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="task-due-date"
                            className="block text-sm font-medium text-[#6B7280]"
                        >
                            Date d'échéance
                        </label>
                        <input
                            id="task-due-date"
                            type="date"
                            value={due_date}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="mt-1 w-full h-11 rounded-lg border border-[#E5E7EB] px-3 text-base text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D6AE3]"
                        />
                        {errors.due_date && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.due_date}
                            </p>
                        )}
                    </div>
                </div>

                {apiError && (
                    <p className="mt-4 text-sm text-red-600">{apiError}</p>
                )}

                <div className="mt-5 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-10 rounded-lg border border-[#E5E7EB] px-4 text-[15px] text-[#0F172A] hover:bg-[#ECEFED]"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className="h-10 rounded-lg px-4 text-[15px] font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                    >
                        Créer
                    </button>
                </div>
            </form>
        </div>,
        document.body,
    );
}

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Calendar, MoreHorizontal, Tag, User as UserIcon } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Task } from "@/features/tasks/types";

type Props = {
    task: Task;
    onDelete: (id: number) => Promise<void>;
};

function slugifyTitle(id: number, title: string): string {
    const slug = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return `${id}-${slug || "tache"}`;
}

export default function TaskItem({ task, onDelete }: Props) {
    const [openDelete, setOpenDelete] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const editHref = `/tasks/${slugifyTitle(task.id, task.title)}`;

    const isReadOnly = task.permission === "read";
    const editLabel = isReadOnly ? "Voir la tâche" : "Modifier";

    return (
        <div className="border-b border-[#E5E7EB] py-5">
            <div className="flex items-start justify-between gap-4 px-5">
                <div className="min-w-0">
                    <h3 className="text-16px font-semibold text-[#0F172A]">
                        {task.title}
                    </h3>
                    {task.description ? (
                        <p className="mt-1 truncate text-15px text-[#6B7280]">
                            {task.description}
                        </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        {task.due_date ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] px-2 py-0.5 text-13px text-[#0F172A]">
                                <Calendar className="h-4 w-4 text-[#0F172A]" />
                                {new Date(task.due_date).toLocaleDateString()}
                            </span>
                        ) : null}
                        {(task.tags ?? []).map((t) => (
                            <span
                                key={t}
                                className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] px-2 py-0.5 text-13px text-[#0F172A]"
                            >
                                <Tag className="h-4 w-4 text-[#0F172A]" />
                                {t}
                            </span>
                        ))}
                        {(task.assignees ?? []).map((a) => (
                            <span
                                key={a}
                                className="inline-flex items-center gap-1 rounded-full bg-[#F5F7F4] px-2 py-0.5 text-13px text-[#0F172A]"
                            >
                                <UserIcon className="h-4 w-4 text-[#0F172A]" />
                                {a}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="relative flex items-center" ref={menuRef}>
                    <button
                        type="button"
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="rounded-md p-2 text-[#0F172A] hover:bg-[#ECEFED]"
                        aria-label="Plus d'actions"
                        title="Plus"
                    >
                        <MoreHorizontal className="h-5 w-5" />
                    </button>

                    {menuOpen ? (
                        <div className="absolute right-0 top-full z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                            <div
                                className="py-1"
                                role="menu"
                                aria-orientation="vertical"
                            >
                                <Link
                                    href={editHref}
                                    onClick={() => setMenuOpen(false)}
                                    className="block w-full px-4 py-2 text-left text-14px text-[#0F172A] hover:bg-[#F3F4F6]"
                                    role="menuitem"
                                >
                                    {editLabel}
                                </Link>
                                {!isReadOnly ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOpenDelete(true);
                                            setMenuOpen(false);
                                        }}
                                        className="block w-full px-4 py-2 text-left text-[14px] text-[#DC2626] hover:bg-[#F3F4F6]"
                                        role="menuitem"
                                    >
                                        Supprimer
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            <ConfirmDialog
                open={openDelete}
                onClose={() => setOpenDelete(false)}
                onConfirm={async () => {
                    await onDelete(task.id);
                    setOpenDelete(false);
                }}
                title="Supprimer la tâche"
                description="Cette action est définitive."
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                tone="danger"
            />
        </div>
    );
}

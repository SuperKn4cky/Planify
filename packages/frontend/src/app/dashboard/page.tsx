"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, FolderPlus, Search } from "lucide-react";
import TaskItem from "@/features/tasks/components/TaskItem";
import type { Task, TaskPriority, TaskStatus } from "@/features/tasks/types";
import {
    createTask,
    deleteTask,
    listTasks,
    createFolder,
} from "@/features/tasks/api";
import { CreateTaskDialog } from "@/features/tasks/components/CreateTaskDialog";

export default function DashboardPage() {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState<"all" | "todo" | "doing" | "done">(
        "all",
    );
    const [sort, setSort] = useState<"recent" | "oldest">("recent");
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreateTaskOpen, setCreateTaskOpen] = useState(false);

    // Chargement des tâches (stub GET /tasks pour l’instant)
    useEffect(() => {
        let aborted = false;
        setLoading(true);
        listTasks({ q: query, status, sort })
            .then(({ data }) => {
                if (!aborted) {
                    setTasks(data);
                }
            })
            .finally(() => !aborted && setLoading(false));
        return () => {
            aborted = true;
        };
    }, [query, status, sort]);

    const filtered = useMemo(() => tasks, [tasks]);

    async function handleCreateTask(data: {
        title: string;
        description: string;
        status: TaskStatus;
        priority: TaskPriority;
        due_date?: string;
    }) {
        const created = await createTask(data);
        // Ajout local pour feedback immédiat
        setTasks((cur) => [
            {
                ...created,
                tags: [],
                assignees: [],
            },
            ...cur,
        ]);
        setCreateTaskOpen(false);
    }

    async function onCreateFolder() {
        const name = window.prompt("Nom du dossier ?");
        if (!name) return;
        await createFolder(name); // stub, affichage non implémenté tant que l’endpoint n’existe pas
        alert(
            "Dossier créé (stub) — branchement à ajouter quand le backend sera prêt.",
        );
    }

    async function onDeleteTask(id: number) {
        await deleteTask(id);
        setTasks((cur) => cur.filter((t) => t.id !== id));
    }

    return (
        <>
            <div className="mx-auto max-w-5xl text-[#0F172A]">
                {/* En-tête */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold">Dashboard</h1>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setCreateTaskOpen(true)}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2563EB] px-4 text-15px font-medium text-white hover:bg-[#1D4ED8]"
                        >
                            <Plus className="h-5 w-5" />
                            Nouvelle tâche
                        </button>

                        <button
                            type="button"
                            onClick={onCreateFolder}
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 text-15px text-[#0F172A] hover:bg-[#ECEFED]"
                        >
                            <FolderPlus className="h-5 w-5" />
                            Nouveau dossier
                        </button>
                    </div>
                </div>

                {/* Barre de recherche et filtres */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-md">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Recherchez une tâche…"
                            className="w-full h-11 rounded-lg border border-[#E5E7EB] pl-10 pr-3 text-base text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D6AE3]"
                        />
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6B7280]" />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as any)}
                            className="h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 text-15px"
                            aria-label="Trier"
                        >
                            <option value="recent">
                                Trier : le plus récent
                            </option>
                            <option value="oldest">
                                Trier : le plus ancien
                            </option>
                        </select>

                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 text-15px"
                            aria-label="Tâches terminées"
                        >
                            <option value="all">
                                Tâches terminées : Afficher
                            </option>
                            <option value="todo">Seulement à faire</option>
                            <option value="doing">En cours</option>
                            <option value="done">Seulement terminées</option>
                        </select>

                        <button
                            type="button"
                            className="h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 text-15px text-[#0F172A] hover:bg-[#ECEFED]"
                        >
                            Tags :
                        </button>
                    </div>
                </div>

                {/* Liste */}
                <div className="mt-6 rounded-xl border border-[#E5E7EB] bg-white">
                    <div className="divide-y divide-[#E5E7EB]">
                        {loading ? (
                            <div className="p-6 text-[#6B7280]">
                                Chargement…
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="p-6 text-[#6B7280]">
                                Aucune tâche pour l’instant.
                            </div>
                        ) : (
                            filtered.map((t) => (
                                <TaskItem
                                    key={t.id}
                                    task={t}
                                    onDelete={onDeleteTask}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
            <CreateTaskDialog
                open={isCreateTaskOpen}
                onClose={() => setCreateTaskOpen(false)}
                onCreate={handleCreateTask}
            />
        </>
    );
}

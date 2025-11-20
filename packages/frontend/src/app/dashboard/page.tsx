"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Plus, FolderPlus, Search } from "lucide-react";
import TaskItem from "@/features/tasks/components/TaskItem";
import type { Task, TaskPriority, TaskStatus } from "@/features/tasks/types";
import {
    createTask,
    deleteTask,
    listTasks,
    createFolder,
    listFolders,
    deleteFolder,
} from "@/features/tasks/api";
import { CreateTaskDialog } from "@/features/tasks/components/CreateTaskDialog";
import { CreateFolderDialog } from "@/features/tasks/components/CreateFolderDialog";

export default function DashboardPage() {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState<"all" | TaskStatus>("all");
    const [sort, setSort] = useState<"recent" | "oldest">("recent");
    const [scope, setScope] = useState<"all" | "mine" | "shared">("all");
    const [tasks, setTasks] = useState<Task[]>([]);
    const [folders, setFolders] = useState<
        Array<{ id: number; name: string; permission?: string }>
    >([]);
    const [folderId, setFolderId] = useState<number | "all">("all");
    const [loading, setLoading] = useState(false);
    const [isCreateTaskOpen, setCreateTaskOpen] = useState(false);
    const [isCreateFolderOpen, setCreateFolderOpen] = useState(false);
    const [openDeleteFolder, setOpenDeleteFolder] = useState(false);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        let aborted = false;
        setLoading(true);

        listTasks({ q: query, status, sort, scope, page, pageSize, folderId })
            .then((res) => {
                if (aborted) return;
                setTasks(res.items);
                setTotalPages(res.totalPages || 1);
            })
            .catch((err) => {
                if (aborted) return;
                console.error(err);
            })
            .finally(() => {
                if (!aborted) setLoading(false);
            });

        return () => {
            aborted = true;
        };
    }, [query, status, sort, scope, page, pageSize, folderId]);

    useEffect(() => {
        let aborted = false;

        async function loadFolders() {
            try {
                const data = await listFolders();
                if (!aborted) setFolders(data);
            } catch (err) {
                if (!aborted) console.error(err);
            }
        }

        loadFolders();

        return () => {
            aborted = true;
        };
    }, []);

    async function handleCreateTask(data: {
        title: string;
        description: string;
        status: TaskStatus;
        priority: TaskPriority;
        due_date?: string;
        folder_id?: number | null;
    }) {
        const created = await createTask(data);
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

    async function handleCreateFolder(name: string) {
        const folder = await createFolder(name);
        setFolders((cur) => [...cur, folder]);
        setCreateFolderOpen(false);
    }

    async function handleDeleteCurrentFolderConfirm() {
        if (folderId === "all") {
            setOpenDeleteFolder(false);
            return;
        }
        const folder = folders.find((f) => f.id === folderId);
        if (!folder) {
            setOpenDeleteFolder(false);
            return;
        }

        await deleteFolder(folder.id);

        setFolders((cur) => cur.filter((f) => f.id !== folder.id));
        setFolderId("all");
        setOpenDeleteFolder(false);
    }

    async function onDeleteTask(id: number) {
        await deleteTask(id);
        setTasks((cur) => cur.filter((t) => t.id !== id));
    }

    const selectedFolder =
        folderId === "all"
            ? null
            : (folders.find((f) => f.id === folderId) ?? null);

    return (
        <>
            {/* En-tête pleine largeur avec bordure basse */}
            <div className="border-b border-[#E5E7EB] bg-white">
                <div className="mx-auto flex max-w-5xl flex-col gap-4 py-4 text-[#0F172A] sm:flex-row sm:items-center sm:justify-between">
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
                            onClick={() => setCreateFolderOpen(true)}
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 text-15px text-[#0F172A] hover:bg-[#ECEFED]"
                        >
                            <FolderPlus className="h-5 w-5" />
                            Nouveau dossier
                        </button>
                    </div>
                </div>
            </div>

            {/* Contenu principal centré */}
            <div className="mx-auto max-w-5xl text-[#0F172A]">
                {/* Barre de recherche */}
                <div className="mt-6">
                    <div className="relative w-full">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Recherchez une tâche…"
                            className="h-11 w-full rounded-lg border border-[#E5E7EB] pl-10 pr-3 text-base text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D6AE3]"
                        />
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6B7280]" />
                    </div>

                    {/* Filtres sous la barre de recherche */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        {/* Tri récent / ancien */}
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

                        {/* Statut todo/doing/done */}
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 text-15px"
                            aria-label="Filtrer par statut"
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="todo">Seulement à faire</option>
                            <option value="doing">En cours</option>
                            <option value="done">Seulement terminées</option>
                        </select>

                        {/* Dossier */}
                        <select
                            value={
                                folderId === "all" ? "all" : String(folderId)
                            }
                            onChange={(e) => {
                                const value = e.target.value;
                                setFolderId(
                                    value === "all" ? "all" : Number(value),
                                );
                                setPage(1);
                            }}
                            className="h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 text-15px"
                            aria-label="Filtrer par dossier"
                        >
                            <option value="all">Tous les dossiers</option>
                            {folders.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.name}
                                </option>
                            ))}
                        </select>

                        {/* Mes tâches / partagées */}
                        <select
                            value={scope}
                            onChange={(e) =>
                                setScope(
                                    e.target.value as "all" | "mine" | "shared",
                                )
                            }
                            className="h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 text-15px"
                            aria-label="Portée des tâches"
                        >
                            <option value="all">Toutes les tâches</option>
                            <option value="mine">Mes tâches</option>
                            <option value="shared">Partagées avec moi</option>
                        </select>
                    </div>

                    {/* Bouton de suppression de dossier sous les filtres */}
                    {selectedFolder && (
                        <div className="mt-2">
                            <button
                                type="button"
                                onClick={() => setOpenDeleteFolder(true)}
                                className="text-sm text-[#DC2626] underline-offset-2 hover:underline"
                            >
                                Supprimer le dossier sélectionné :{" "}
                                {selectedFolder.name}
                            </button>
                        </div>
                    )}
                </div>

                {/* Liste */}
                <div className="mt-6 rounded-xl border border-[#E5E7EB] bg-white">
                    <div className="divide-y divide-[#E5E7EB]">
                        {loading ? (
                            <div className="p-6 text-[#6B7280]">
                                Chargement…
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="p-6 text-[#6B7280]">
                                Aucune tâche pour l’instant.
                            </div>
                        ) : (
                            tasks.map((t) => (
                                <TaskItem
                                    key={t.id}
                                    task={t}
                                    onDelete={onDeleteTask}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Pagination + choix du nombre d'éléments */}
                <div className="mt-4 flex flex-col gap-3 text-sm text-[#6B7280] sm:flex-row sm:items-center sm:justify-between">
                    {/* À gauche : choix du nombre d'éléments */}
                    <div className="flex items-center gap-2">
                        <span>Éléments par page :</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                const next = Number(e.target.value);
                                setPageSize(next);
                                setPage(1);
                            }}
                            className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-2 text-[13px]"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>

                    {/* À droite : numéro de page + boutons */}
                    <div className="flex items-center justify-end gap-2">
                        <span>
                            Page {page} / {totalPages || 1}
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setPage((p) => Math.max(1, p - 1))
                                }
                                disabled={page <= 1 || loading}
                                className="h-8 rounded-lg border border-[#E5E7EB] px-3 disabled:opacity-50"
                            >
                                Précédent
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setPage((p) => (p < totalPages ? p + 1 : p))
                                }
                                disabled={page >= totalPages || loading}
                                className="h-8 rounded-lg border border-[#E5E7EB] px-3 disabled:opacity-50"
                            >
                                Suivant
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <CreateTaskDialog
                open={isCreateTaskOpen}
                onClose={() => setCreateTaskOpen(false)}
                onCreate={handleCreateTask}
                folders={folders}
                defaultFolderId={folderId}
            />

            <CreateFolderDialog
                open={isCreateFolderOpen}
                onClose={() => setCreateFolderOpen(false)}
                onCreate={handleCreateFolder}
            />

            <ConfirmDialog
                open={openDeleteFolder}
                onClose={() => setOpenDeleteFolder(false)}
                onConfirm={handleDeleteCurrentFolderConfirm}
                title="Supprimer le dossier"
                description={
                    selectedFolder
                        ? `Le dossier "${selectedFolder.name}" sera supprimé. Les tâches resteront mais sans dossier.`
                        : "Ce dossier sera supprimé. Les tâches resteront mais sans dossier."
                }
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                tone="danger"
            />
        </>
    );
}

"use client";

import { useEffect, useState } from "react";
import { getJSON, postJSON, delJSON } from "@/lib/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Contact = {
    id: number;
    email: string;
    first_name: string | null;
    last_name: string | null;
};

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [email, setEmail] = useState("");
    const [inviteMessage, setInviteMessage] = useState<string | null>(null);
    const [inviteLoading, setInviteLoading] = useState(false);

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<Contact | null>(
        null,
    );

    useEffect(() => {
        let aborted = false;

        async function loadContacts() {
            setLoading(true);
            setError(null);

            try {
                const data = await getJSON<Contact[]>("/api/contacts");
                if (!aborted) setContacts(data);
            } catch (err) {
                if (!aborted) {
                    console.error(err);
                    setError("Impossible de charger les contacts.");
                }
            } finally {
                if (!aborted) setLoading(false);
            }
        }

        loadContacts();
        return () => {
            aborted = true;
        };
    }, []);

    async function handleSendInvitation(e: React.FormEvent) {
        e.preventDefault();
        setInviteMessage(null);
        setError(null);

        const trimmed = email.trim();
        if (!trimmed) {
            setError("L’email du contact est requis.");
            return;
        }

        setInviteLoading(true);
        try {
            await postJSON<{ message: string }>("/api/contacts", {
                email: trimmed,
            });
            setInviteMessage(
                "Invitation envoyée. Le contact apparaîtra une fois l’invitation acceptée.",
            );
            setEmail("");
        } catch (err: any) {
            console.error(err);
            const msg =
                typeof err?.message === "string"
                    ? err.message
                    : "Impossible d’envoyer l’invitation.";
            setError(msg);
        } finally {
            setInviteLoading(false);
        }
    }

    function askDeleteContact(contact: Contact) {
        setContactToDelete(contact);
        setOpenDeleteDialog(true);
    }

    async function confirmDeleteContact() {
        if (!contactToDelete) {
            setOpenDeleteDialog(false);
            return;
        }

        setError(null);
        try {
            await delJSON<{ message: string }>(
                `/api/contacts/${contactToDelete.id}`,
            );
            setContacts((cur) =>
                cur.filter((c) => c.id !== contactToDelete.id),
            );
        } catch (err) {
            console.error(err);
            setError("Impossible de supprimer ce contact.");
        } finally {
            setOpenDeleteDialog(false);
            setContactToDelete(null);
        }
    }

    return (
        <>
            {/* Header style dashboard */}
            <div className="sticky top-0 z-10 border-b border-[#E5E7EB] bg-white">
                <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 py-4 text-[#0F172A] sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1 text-center sm:text-left">
                        <h1 className="text-2xl font-semibold">Contacts</h1>
                        <p className="text-[14px] text-[#6B7280]">
                            Gérez vos contacts et envoyez des invitations.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-5xl text-[#0F172A]">
                {/* Form (bouton toujours visible) */}
                <div className="mt-6">
                    <form
                        onSubmit={handleSendInvitation}
                        className="flex flex-col gap-3 sm:flex-row sm:items-center"
                    >
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@exemple.com"
                            className="h-11 w-full flex-1 rounded-lg border border-[#E5E7EB] px-3 text-base text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2D6AE3]"
                        />

                        <button
                            type="submit"
                            disabled={inviteLoading}
                            className="inline-flex h-10 w-full shrink-0 items-center justify-center rounded-lg bg-[#2563EB] px-4 text-[15px] font-medium text-white hover:bg-[#1D4ED8] disabled:opacity-60 sm:w-auto"
                        >
                            {inviteLoading ? "Envoi..." : "Ajouter"}
                        </button>
                    </form>

                    {inviteMessage ? (
                        <div className="mt-3 rounded-lg border border-[#E5E7EB] bg-[#ECEFED] px-4 py-3 text-xs text-[#6B7280]">
                            {inviteMessage}
                        </div>
                    ) : null}

                    {error ? (
                        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[#B91C1C]">
                            {error}
                        </div>
                    ) : null}
                </div>

                {/* List (même pattern dashboard) */}
                <div className="mt-6 rounded-xl border border-[#E5E7EB] bg-white">
                    <div className="divide-y divide-[#E5E7EB]">
                        {loading ? (
                            <div className="p-6 text-[#6B7280]">
                                Chargement des contacts...
                            </div>
                        ) : contacts.length === 0 ? (
                            <div className="p-6 text-[#6B7280]">
                                Aucun contact pour l’instant.
                            </div>
                        ) : (
                            contacts.map((c) => {
                                const fullName = [c.first_name, c.last_name]
                                    .filter(Boolean)
                                    .join(" ");

                                return (
                                    <div
                                        key={c.id}
                                        className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="min-w-0">
                                            <div className="text-[15px] font-medium text-[#0F172A]">
                                                {fullName || "—"}
                                            </div>
                                            <div className="mt-1 truncate text-[14px] text-[#6B7280]">
                                                {c.email}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    askDeleteContact(c)
                                                }
                                                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#DC2626] px-4 text-[15px] font-medium text-white hover:bg-[#B91C1C]"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <ConfirmDialog
                    open={openDeleteDialog}
                    onClose={() => {
                        setOpenDeleteDialog(false);
                        setContactToDelete(null);
                    }}
                    onConfirm={confirmDeleteContact}
                    title="Supprimer ce contact ?"
                    description={
                        contactToDelete
                            ? `Voulez-vous vraiment supprimer ${
                                  [
                                      contactToDelete.first_name,
                                      contactToDelete.last_name,
                                  ]
                                      .filter(Boolean)
                                      .join(" ") || contactToDelete.email
                              } de vos contacts ?`
                            : undefined
                    }
                    confirmLabel="Supprimer"
                    cancelLabel="Annuler"
                    tone="danger"
                />
            </div>
        </>
    );
}

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
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  useEffect(() => {
    let aborted = false;

    async function loadContacts() {
      setLoading(true);
      setError(null);
      try {
        const data = await getJSON<Contact[]>("api/contacts");
        if (!aborted) {
          setContacts(data);
        }
      } catch (err) {
        if (!aborted) {
          console.error(err);
          setError("Impossible de charger les contacts.");
        }
      } finally {
        if (!aborted) {
          setLoading(false);
        }
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
      setError("L'email du contact est requis.");
      return;
    }

    setInviteLoading(true);
    try {
      await postJSON<{ message: string }>("api/contacts", {
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
          : "Impossible d'envoyer l'invitation.";
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
        `api/contacts/${contactToDelete.id}`,
      );
      setContacts((cur) => cur.filter((c) => c.id !== contactToDelete.id));
    } catch (err) {
      console.error(err);
      setError("Impossible de supprimer ce contact.");
    } finally {
      setOpenDeleteDialog(false);
      setContactToDelete(null);
    }
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            Mes contacts
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Consultez vos contacts et envoyez de nouvelles invitations.
          </p>
        </header>

        <section className="mb-8 rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <h2 className="text-sm font-medium text-slate-800 mb-3">
            Ajouter un contact
          </h2>

          <form
            onSubmit={handleSendInvitation}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={inviteLoading}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {inviteLoading ? "Envoi..." : "Envoyer une invitation"}
            </button>
          </form>

          {inviteMessage && (
            <p className="mt-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              {inviteMessage}
            </p>
          )}
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <h2 className="text-sm font-medium text-slate-800 mb-3">
            Liste de vos contacts
          </h2>

          {error && (
            <p className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {loading ? (
            <p className="text-sm text-slate-600">Chargement des contacts...</p>
          ) : contacts.length === 0 ? (
            <p className="text-sm text-slate-600">
              Vous n&apos;avez encore aucun contact.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-left font-medium text-slate-700">
                      Nom
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">
                      Email
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => {
                    const fullName =
                      [contact.first_name, contact.last_name]
                        .filter(Boolean)
                        .join(" ") || "—";

                    return (
                      <tr
                        key={contact.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-3 py-2 text-slate-900">
                          {fullName}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {contact.email}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => askDeleteContact(contact)}
                            className="inline-flex items-center rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
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
            ? `Voulez-vous vraiment supprimer ${[
                contactToDelete.first_name,
                contactToDelete.last_name,
              ]
                .filter(Boolean)
                .join(" ") || contactToDelete.email} de vos contacts ?`
            : undefined
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        tone="danger"
      />
    </main>
  );
}

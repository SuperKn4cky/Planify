"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Users, FolderKanban } from "lucide-react";

type HealthStatus = "OK" | "FAIL" | null;

export default function Home() {
    const [health, setHealth] = useState<HealthStatus>(null);

    useEffect(() => {
        fetch("/api/health")
            .then((res) => res.json())
            .then((data) => {
                if (data.status === "OK") {
                    setHealth("OK");
                } else {
                    setHealth("FAIL");
                }
            })
            .catch(() => setHealth("FAIL"));
    }, []);

    const healthLabel =
        health === "OK"
            ? "Backend opérationnel"
            : health === "FAIL"
              ? "Backend indisponible"
              : "Vérification du backend...";

    const healthClassName =
        health === "OK"
            ? "bg-green-50 text-green-700 border-green-200"
            : health === "FAIL"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-gray-50 text-gray-600 border-gray-200";

    return (
        <main className="w-full bg-white text-0F172A">
            <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-10 lg:flex-row lg:items-center">
                {/* Colonne gauche : hero + CTA */}
                <section className="flex-1 space-y-6">
                    <span className="inline-flex items-center rounded-full bg-ECEFED px-3 py-1 text-xs font-medium text-2563EB">
                        Application de gestion de tâches collaborative
                    </span>

                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Organisez vos tâches, dossiers et projets en toute
                        sécurité.
                    </h1>

                    <p className="text-base text-6B7280">
                        Planify est une application web autohébergeable qui
                        permet de créer, organiser et suivre des tâches et
                        sous-tâches par dossiers, labels et commentaires.
                    </p>

                    <p className="text-base text-6B7280">
                        Gérez les statuts todo, doing, done, les priorités et
                        les dates d’échéance, tout en suivant l’avancement dans
                        un tableau de bord clair.
                    </p>

                    <p className="text-base text-6B7280">
                        Collaborez via des invitations et un carnet de contacts,
                        attribuez un responsable à chaque tâche et contrôlez
                        finement les droits avec des permissions propriétaire,
                        lecture et écriture.
                    </p>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Link
                            href="/auth/register"
                            className="inline-flex h-11 items-center justify-center rounded-lg bg-2563EB px-5 text-sm font-medium text-white hover:bg-1D4ED8"
                        >
                            Créer un compte
                        </Link>
                        <Link
                            href="/auth/login"
                            className="inline-flex h-11 items-center justify-center rounded-lg border border-E5E7EB px-5 text-sm font-medium text-0F172A hover:bg-ECEFED"
                        >
                            Se connecter
                        </Link>
                    </div>

                    <div
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${healthClassName}`}
                    >
                        <span className="inline-block h-2 w-2 rounded-full bg-current opacity-70" />
                        <span>{healthLabel}</span>
                    </div>

                    <ul className="mt-4 space-y-2 text-sm text-6B7280">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                            <span>
                                Authentification par email et mot de passe avec
                                JWT valable 7 jours, stocké en cookie HttpOnly
                                et Secure.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                            <span>
                                Mots de passe hachés en Argon2id, JWT HS256,
                                CORS par allowlist et révocation de sessions par
                                timestamp.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                            <span>
                                Déploiement durci avec Traefik, TLS en
                                production, en-têtes de sécurité et rate
                                limiting pour l’API.
                            </span>
                        </li>
                    </ul>
                </section>

                {/* Colonne droite : encadré "fonctionnalités" */}
                <aside className="flex-1 rounded-2xl border border-E5E7EB bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-0F172A">
                        Tout-en-un pour vos tâches
                    </h2>
                    <p className="mt-2 text-sm text-6B7280">
                        Une stack moderne React / Next.js côté frontend, Node.js
                        / Express et PostgreSQL côté backend, pour un
                        déploiement simple en monorepo.
                    </p>

                    <div className="mt-5 space-y-4">
                        <div className="flex gap-3">
                            <div className="mt-1 rounded-lg bg-ECEFED p-2 text-2563EB">
                                <FolderKanban className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-0F172A">
                                    Tâches structurées par dossiers
                                </h3>
                                <p className="text-sm text-6B7280">
                                    Classez vos tâches dans des dossiers,
                                    ajoutez labels, commentaires et sous-tâches
                                    type checklist pour ne rien oublier.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="mt-1 rounded-lg bg-ECEFED p-2 text-2563EB">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-0F172A">
                                    Collaboration et partage
                                </h3>
                                <p className="text-sm text-6B7280">
                                    Invitez des contacts, attribuez un
                                    responsable aux tâches et partagez dossiers
                                    et tâches avec des droits owner, read ou
                                    write.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="mt-1 rounded-lg bg-ECEFED p-2 text-2563EB">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-0F172A">
                                    Sécurité prête pour la prod
                                </h3>
                                <p className="text-sm text-6B7280">
                                    Images Distroless non-root, reverse-proxy
                                    Traefik, réseaux Docker isolés et
                                    middlewares de sécurité configurés par
                                    défaut.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 rounded-lg bg-ECEFED px-4 py-3 text-xs text-6B7280">
                        <p>
                            Autohébergeable via Docker Compose, avec base
                            PostgreSQL, pgAdmin optionnel et configuration SMTP
                            pour l’envoi d’e-mails.
                        </p>
                    </div>
                </aside>
            </div>
        </main>
    );
}

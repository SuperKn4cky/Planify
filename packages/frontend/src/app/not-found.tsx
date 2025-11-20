export default function NotFound() {
    return (
        <div className="grid h-full place-items-center bg-white text-[#0F172A]">
            <div className="text-center px-6">
                <p className="text-sm/6 opacity-70">Erreur 404</p>
                <h1 className="mt-2 text-3xl font-semibold">
                    Page introuvable
                </h1>
                <p className="mt-2 opacity-70">
                    La ressource demandée n'existe pas ou a été déplacée.
                </p>
                <a
                    href="/"
                    className="mt-6 inline-flex items-center rounded-md bg-[#0F172A] px-4 py-2 text-white hover:opacity-90 transition"
                >
                    Retour à l'accueil
                </a>
            </div>
        </div>
    );
}

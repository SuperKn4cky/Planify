import crypto from "crypto";

export default function generateJwtSecret(nodeEnv: string): string {
    if (nodeEnv === "production") {
        throw new Error(
            "JWT_SECRET manquant. Veuillez le définir dans le fichier .env",
        );
    } else {
        return crypto.randomBytes(32).toString("base64");
    }
}

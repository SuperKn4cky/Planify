import fs from "fs";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const envPath = path.resolve(process.cwd(), ".env");

let jwtSecret = process.env.JWT_SECRET;

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET manquant. Veuillez le définir dans le fichier .env");
}

if (!jwtSecret) {
  jwtSecret = crypto.randomBytes(32).toString("base64");

  fs.appendFileSync(envPath, `\nJWT_SECRET=${jwtSecret}\n`);

  console.log("JWT_SECRET généré et ajouté au .env");
}

export const JWT_SECRET = jwtSecret;

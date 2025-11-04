import { z } from "zod";

export const loginSchema = z.object({
    email: z.email("Email invalide"),
    password: z.string().min(1, "Mot de passe requis"),
});

export const nameRegex = /^[\p{L}\p{M}' -]+$/u;

export const registerSchema = z
    .object({
        first_name: z
            .string()
            .min(2, "Prénom trop court")
            .max(30, "Prénom trop long")
            .regex(
                nameRegex,
                "Le prénom ne doit contenir que des lettres, ' ou -",
            ),
        last_name: z
            .string()
            .min(2, "Nom trop court")
            .max(30, "Nom trop long")
            .regex(
                nameRegex,
                "Le nom ne doit contenir que des lettres, ' ou -",
            ),
        email: z
            .email("Email invalide")
            .min(5, "Email invalide")
            .max(60, "Email invalide"),
        password: z
            .string()
            .min(12, "Le mot de passe doit contenir au moins 12 caractères")
            .max(255, "Le mot de passe doit contenir au maximum 255 caractères")
            .regex(
                /[A-Z]/,
                "Le mot de passe doit contenir au moins une majuscule",
            )
            .regex(
                /[a-z]/,
                "Le mot de passe doit contenir au moins une minuscule",
            )
            .regex(/\d/, "Le mot de passe doit contenir au moins un chiffre")
            .regex(
                /[@$!%*?&]/,
                "Le mot de passe doit contenir au moins un caractère spécial (@$!%*?&)",
            ),
        confirm: z.string().min(1, "Confirmation requise"),
    })
    .refine((v) => v.password === v.confirm, {
        message: "Les mots de passe ne correspondent pas",
        path: ["confirm"],
    });

export const accountSchema = z.object({
    firstname: z
        .string()
        .min(2, "Prénom trop court")
        .max(30, "Prénom trop long")
        .regex(
            /^[a-zA-Z-]+$/,
            "Le prénom ne doit contenir que des lettres, ou -",
        ),
    lastname: z
        .string()
        .min(2, "Nom trop court")
        .max(30, "Nom trop long")
        .regex(/^[a-zA-Z-]+$/, "Le nom ne doit contenir que des lettres, ou -"),
    email: z
        .email("Email invalide")
        .min(5, "Email invalide")
        .max(60, "Email invalide"),
});

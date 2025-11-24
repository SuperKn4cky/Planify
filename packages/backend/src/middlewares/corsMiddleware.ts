import cors from "cors";

const LOCAL_ALLOWLIST = new Set<string>([
    "http://localhost:3000",
    "http://planify",
]);

export const corsOptions = (): cors.CorsOptions => {
    const isAllowed = (origin?: string) => {
        if (!origin) return true;
        return LOCAL_ALLOWLIST.has(origin);
    };

    return {
        origin: (origin, callback) => {
            if (isAllowed(origin)) {
                return callback(null, true);
            }
            if (process.env.NODE_ENV !== "production") {
                console.warn(`CORS blocked origin: ${origin}`);
            }
            return callback(new Error("Origin not allowed by CORS"));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-CSRF-Token",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Referer",
        ],
        credentials: true,
        maxAge: 600,
    };
};

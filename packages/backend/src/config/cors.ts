import cors from "cors";

export const corsOptions = (
    frontendUrl?: string | string[],
): cors.CorsOptions => {
    const allowedOrigins = Array.isArray(frontendUrl)
        ? frontendUrl.map((u) => u.trim()).filter(Boolean)
        : (frontendUrl || "")
              .split(",")
              .map((u) => u.trim())
              .filter(Boolean);

    return {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.log(
                    `CORS blocked origin: ${origin}, allowed origins: ${allowedOrigins}`,
                );
                callback(new Error("Origin not allowed by CORS"));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
        credentials: true,
    };
};

import express from "express";
import dotenv from "dotenv";
import { setRoutes } from "./routes";
import { errorHandler } from "./middlewares/errorHandler";

dotenv.config();
export const NODE_ENV = process.env.NODE_ENV;

if (!NODE_ENV) {
    throw new Error("NODE_ENV is not defined in environment variables.");
}

export const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

async function startServer() {
    try {
        setRoutes(app);

        app.use(errorHandler);

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();

import express from "express";
import dotenv from "dotenv";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";

dotenv.config();
export const NODE_ENV = process.env.NODE_ENV;

if (!NODE_ENV) {
    throw new Error("NODE_ENV is not defined in environment variables.");
}

export const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

async function startServer() {
    try {
        new routes(app);

        app.use((req, res) => {
            res.status(404).json({
                error: "This resource does not exist.",
                req: req.originalUrl,
            });
        });

        app.use(errorHandler);

        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });

    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();
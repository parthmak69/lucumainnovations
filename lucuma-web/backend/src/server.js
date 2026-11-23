import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import healthRoutes from "./routes/health.js";
import mailRoutes from "./routes/mail.js";

dotenv.config();

const app = express();

app.use(helmet());

const allowedOrigins = (process.env.DOCS_ORIGINS || process.env.DOCS_ORIGIN || "http://localhost:5500,http://localhost:5173").split(",").map(x => x.trim()).filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
}));

app.use(express.json({
    limit: "15mb"
}));

app.get("/", (req, res) => {

    res.json({
        application: "Lucuma Docs Backend",
        status: "Running",
        version: "1.0.0"
    });

});

app.use("/api/health", healthRoutes);
app.use("/api/mail", mailRoutes);

app.use((err, req, res, next) => {
    console.error("Lucuma API error:", err);
    if (res.headersSent) return next(err);
    res.status(500).json({ error: "The server could not complete this request." });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {

    console.log("----------------------------------");
    console.log("LUCUMA DOCS BACKEND");
    console.log("----------------------------------");
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log("----------------------------------");

});
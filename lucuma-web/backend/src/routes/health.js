import express from "express";
import db from "../config/database.js";

const router = express.Router();

router.get("/", async (req, res) => {

    try {

        const [rows] = await db.query(
            "SELECT DATABASE() AS database_name, NOW() AS server_time"
        );

        res.status(200).json({
            success: true,
            message: "Lucuma Docs API is running",
            database: {
                connected: true,
                name: rows[0].database_name,
                serverTime: rows[0].server_time
            }
        });

    } catch (error) {

        console.error("Database connection error:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });

    }

});

export default router;
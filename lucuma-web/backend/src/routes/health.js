import express from "express";
import db from "../config/database.js";
const router = express.Router();
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 'lucuma-docs-prod' AS database_name, CURRENT_TIMESTAMP AS server_time");
    res.status(200).json({ success: true, message: "Lucuma Docs API is running", database: { connected: true, name: rows[0]?.database_name, serverTime: rows[0]?.server_time } });
  } catch (error) {
    console.error("D1 connection error:", error.message);
    res.status(500).json({ success: false, message: "Cloudflare D1 connection failed" });
  }
});
export default router;

// src/routes/index.js
import express from "express";

const router = express.Router();

// Temporary home route
router.get("/", (req, res) => {
  res.send("Odin-Book server is running!");
});

export default router;

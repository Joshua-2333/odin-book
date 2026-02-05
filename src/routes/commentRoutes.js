// src/routes/commentRoutes.js
import express from "express";
import ensureAuth from "../middleware/ensureAuth.js";
import ensureGuest from "../middleware/ensureGuest.js";
import commentController from "../controllers/commentController.js";

const router = express.Router();

// Add a comment (auth users only)
router.post("/", ensureGuest, ensureAuth, commentController.create);

export default router;

// src/routes/postRoutes.js
import express from "express";
import ensureAuth from "../middleware/ensureAuth.js";
import ensureGuest from "../middleware/ensureGuest.js";
import postController from "../controllers/postController.js";
import commentController from "../controllers/commentController.js";

const router = express.Router();

// View all posts (guests allowed)
router.get("/", postController.index);

// Create a post (auth users only)
router.post("/", ensureGuest, ensureAuth, postController.create);

// Like a post (auth users only)
router.post("/:id/like", ensureGuest, ensureAuth, postController.like);

// Add a comment (auth users only)
router.post("/:id/comments", ensureGuest, ensureAuth, commentController.create);

export default router;

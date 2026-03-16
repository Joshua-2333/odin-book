// src/routes/postRoutes.js

import express from "express";
import ensureAuth from "../middleware/ensureAuth.js";
import postController from "../controllers/postController.js";
import commentController from "../controllers/commentController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// View all posts (guests allowed)
router.get("/", postController.index);

// Create a post (auth users only)
router.post(
  "/",
  ensureAuth,
  upload.single("media"),
  postController.create
);

// Like/unlike a post (AJAX-friendly)
router.post("/:id/like", ensureAuth, async (req, res) => {
  try {
    // Delegate the like/unlike operation to postController
    await postController.like(req, res);
  } catch (err) {
    console.error("Error liking/unliking post:", err);
    res.status(500).json({ error: "Failed to like/unlike post" });
  }
});

// Add a comment (AJAX)
router.post("/:id/comments", ensureAuth, async (req, res) => {
  try {
    const comment = await commentController.create(req, res);

    res.json({
      id: comment.id,
      content: comment.content,
      author: {
        id: comment.author.id,
        username: comment.author.username,
        avatar: comment.author.avatar || "/avatars/default.png"
      },
      createdAt: comment.createdAt
    });
  } catch (err) {
    console.error("Error creating comment:", err);
    res.status(500).json({ error: "Failed to post comment" });
  }
});

export default router;
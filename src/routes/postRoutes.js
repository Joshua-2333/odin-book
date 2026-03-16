// src/routes/postRoutes.js

import express from "express";
import ensureAuth from "../middleware/ensureAuth.js";
import ensureGuest from "../middleware/ensureGuest.js";
import postController from "../controllers/postController.js";
import commentController from "../controllers/commentController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// View all posts (guests allowed)
router.get("/", postController.index);

// Create a post (auth users only)
router.post(
  "/",
  ensureGuest,
  ensureAuth,
  upload.single("media"),
  postController.create
);

// Like a post
router.post(
  "/:id/like",
  ensureGuest,
  ensureAuth,
  postController.like
);

// Add a comment (returns JSON for AJAX)
router.post("/:id/comments", ensureGuest, ensureAuth, async (req, res) => {
  try {
    // Call the existing commentController.create but get the created comment
    const comment = await commentController.create(req, res);

    // Return the comment with author info as JSON
    res.json({
      id: comment.id,
      content: comment.content,
      author: {
        id: comment.author.id,
        username: comment.author.username,
        avatar: comment.author.avatar || '/avatars/default.png'
      },
      createdAt: comment.createdAt
    });
  } catch (err) {
    console.error("Error creating comment:", err);
    res.status(500).json({ error: "Failed to post comment" });
  }
});

export default router;
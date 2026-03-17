// src/controllers/commentController.js

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const DEFAULT_AVATAR = "/avatars/default.png";

const commentController = {

  // POST /posts/:id/comments
  async create(req, res) {

    const postId = Number(req.params.id);
    const { content } = req.body;

    // Detect AJAX / fetch requests more reliably
    const isAjax =
      req.xhr ||
      req.headers["x-requested-with"] === "XMLHttpRequest" ||
      req.headers.accept?.includes("application/json");

    // Validate postId
    if (!postId) {

      if (isAjax) {
        return res.status(400).json({
          error: "Invalid post."
        });
      }

      req.session.error = "Invalid post.";
      return res.redirect("/posts");
    }

    // Validate comment content
    if (!content || !content.trim()) {

      if (isAjax) {
        return res.status(400).json({
          error: "Comment cannot be empty."
        });
      }

      req.session.error = "Comment cannot be empty.";
      return res.redirect("/posts");
    }

    try {

      // Create comment
      const newComment = await prisma.comment.create({
        data: {
          content: content.trim(),
          postId,
          authorId: req.user.id,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              profileImage: true,
            }
          }
        }
      });

      const responsePayload = {
        id: newComment.id,
        content: newComment.content,
        createdAt: newComment.createdAt,
        author: {
          id: newComment.author.id,
          username: newComment.author.username,
          avatar: newComment.author.profileImage || DEFAULT_AVATAR
        }
      };

      // JSON response for fetch()
      if (isAjax) {
        return res.status(201).json(responsePayload);
      }

      // Normal form fallback
      req.session.success = "Comment added!";
      return res.redirect("/posts");

    } catch (err) {

      console.error("Failed to add comment:", err);

      if (isAjax) {
        return res.status(500).json({
          error: err.message || "Failed to add comment."
        });
      }

      req.session.error = "Failed to add comment. Try again.";
      return res.redirect("/posts");
    }
  }

};

export default commentController;
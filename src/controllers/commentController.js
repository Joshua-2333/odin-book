// src/controllers/commentController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const commentController = {
  // POST /posts/:id/comments
  async create(req, res) {
    const postId = Number(req.params.id);
    const { content } = req.body;

    if (!content?.trim()) {
      req.session.error = "Comment cannot be empty.";
      return res.redirect("/posts");
    }

    try {
      await prisma.comment.create({
        data: {
          content,
          postId,
          authorId: req.user.id,
        },
      });
      req.session.success = "Comment added!";
    } catch (err) {
      console.error(err);
      req.session.error = "Failed to add comment. Try again.";
    }

    res.redirect("/posts");
  },
};

export default commentController;

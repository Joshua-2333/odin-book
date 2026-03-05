// src/controllers/postController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const postController = {
  // GET /posts
  async index(req, res) {
    try {
      const posts = await prisma.post.findMany({
        include: {
          author: true,
          likes: true,
          comments: {
            include: { author: true },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.render("posts/index", {
        layout: "layouts/main",
        title: "Posts",
        posts,
        success: req.session.success,
        error: req.session.error,
        currentUser: req.user,
      });

      req.session.success = null;
      req.session.error = null;
    } catch (err) {
      console.error(err);

      res.render("posts/index", {
        layout: "layouts/main",
        title: "Posts",
        posts: [],
        success: null,
        error: "Failed to load posts.",
        currentUser: req.user,
      });
    }
  },

  // POST /posts
  async create(req, res) {
    const { content } = req.body;

    if (!content?.trim()) {
      req.session.error = "Post cannot be empty.";
      return res.redirect("/posts");
    }

    try {
      await prisma.post.create({
        data: {
          content,
          authorId: req.user.id,
        },
      });

      req.session.success = "Post created successfully!";
    } catch (err) {
      console.error(err);
      req.session.error = "Failed to create post. Try again.";
    }

    res.redirect("/posts");
  },

  // POST /posts/:id/like
  async like(req, res) {
    const postId = Number(req.params.id);

    try {
      await prisma.like.create({
        data: {
          userId: req.user.id,
          postId,
        },
      });

      req.session.success = "You liked the post!";
    } catch (err) {
      req.session.error = "You already liked this post.";
    }

    res.redirect("/posts");
  },
};

export default postController;

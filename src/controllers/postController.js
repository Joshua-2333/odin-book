// src/controllers/postController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const postController = {
  // GET /posts
  async index(req, res) {
    try {
      const posts = await prisma.post.findMany({
        include: {
          author: true, // Include author info
          likes: true,
          comments: {
            include: { author: true },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Ensure every post and comment has valid author info
      const safePosts = posts.map(post => ({
        ...post,
        mediaUrl: post.mediaUrl || null,
        mediaType: post.mediaType || null,
        author: post.author || {
          id: req.user?.id || null,
          username: req.user?.username || "Unknown",
          avatar: req.user?.avatar || "/avatars/default.png",
        },
        comments: post.comments.map(comment => ({
          ...comment,
          author: comment.author || {
            id: null,
            username: "Unknown",
            avatar: "/avatars/default.png",
          },
        })),
      }));

      res.render("posts/index", {
        layout: "layouts/main",
        title: "Posts",
        posts: safePosts,
        success: req.session.success,
        error: req.session.error,
        currentUser: req.user,
      });

      // Clear flash messages after render
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

    let mediaUrl = null;
    let mediaType = null;

    if (!content?.trim() && !req.file) {
      req.session.error = "Post must contain text or media.";
      return res.redirect("/posts");
    }

    try {
      if (req.file) {
        mediaUrl = "/uploads/" + req.file.filename;

        if (req.file.mimetype.startsWith("image")) {
          mediaType = req.file.mimetype === "image/gif" ? "GIF" : "IMAGE";
        } else if (req.file.mimetype.startsWith("video")) {
          mediaType = "VIDEO";
        }
      }

      await prisma.post.create({
        data: {
          content,
          mediaUrl,
          mediaType,
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

  // POST /posts/:id/like (AJAX-friendly)
  async like(req, res) {
    const postId = Number(req.params.id);
    const userId = req.user.id;

    try {
      // Check if the user already liked the post
      const existingLike = await prisma.like.findFirst({
        where: { postId, userId },
      });

      let liked;

      if (existingLike) {
        // Unlike
        await prisma.like.delete({
          where: { id: existingLike.id },
        });
        liked = false;
      } else {
        // Like
        await prisma.like.create({
          data: { postId, userId },
        });
        liked = true;
      }

      // PATCH: get the **updated likes count** for the post
      const likesCount = await prisma.like.count({
        where: { postId },
      });

      // Respond with updated likes count and liked status
      res.json({ likesCount, liked });

    } catch (err) {
      console.error("Error liking/unliking post:", err);
      res.status(500).json({ error: "Failed to like/unlike post" });
    }
  },

  // Helper to get a post by ID (for routes)
  async getById(id) {
    return await prisma.post.findUnique({
      where: { id: Number(id) },
      include: {
        author: true,
        likes: true,
        comments: { include: { author: true } },
      },
    });
  },
};

export default postController;
// src/controllers/postController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const DEFAULT_AVATAR = "/avatars/default.png";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const VIDEO_EXTENSIONS = ["mp4", "webm"];

function extractMediaFromContent(rawContent = "") {
  const content = rawContent.trim();
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const urls = content.match(urlRegex) || [];

  let mediaUrl = null;
  let mediaType = null;

  for (const url of urls) {
    const cleanUrl = url.trim();
    const lowerUrl = cleanUrl.toLowerCase();

    if (IMAGE_EXTENSIONS.some(ext => lowerUrl.includes(`.${ext}`))) {
      mediaUrl = cleanUrl;
      mediaType = lowerUrl.includes(".gif") ? "GIF" : "IMAGE";
      break;
    }

    if (VIDEO_EXTENSIONS.some(ext => lowerUrl.includes(`.${ext}`))) {
      mediaUrl = cleanUrl;
      mediaType = "VIDEO";
      break;
    }
  }

  let cleanedContent = content;

  if (mediaUrl) {
    cleanedContent = cleanedContent.replace(mediaUrl, "").trim();
  }

  return {
    cleanedContent,
    mediaUrl,
    mediaType
  };
}

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

      const safePosts = posts.map(post => ({
        ...post,
        mediaUrl: post.mediaUrl || null,
        mediaType: post.mediaType || null,

        author: post.author
          ? {
              ...post.author,
              avatar: post.author.profileImage || DEFAULT_AVATAR,
            }
          : {
              id: req.user?.id || null,
              username: req.user?.username || "Unknown",
              avatar: req.user?.profileImage || DEFAULT_AVATAR,
            },

        comments: post.comments.map(comment => ({
          ...comment,
          author: comment.author
            ? {
                ...comment.author,
                avatar: comment.author.profileImage || DEFAULT_AVATAR,
              }
            : {
                id: null,
                username: "Unknown",
                avatar: DEFAULT_AVATAR,
              },
        })),
      }));

      res.render("posts/index", {
        layout: "layouts/main",
        title: "Posts",
        posts: safePosts,
        success: req.session.success,
        error: req.session.error,
        currentUser: {
          ...req.user,
          avatar: req.user?.profileImage || DEFAULT_AVATAR,
        },
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
        currentUser: {
          ...req.user,
          avatar: req.user?.profileImage || DEFAULT_AVATAR,
        },
      });
    }
  },

  // POST /posts
  async create(req, res) {
    const rawContent = req.body.content || "";

    let content = rawContent;
    let mediaUrl = null;
    let mediaType = null;

    if (!rawContent?.trim() && !req.file) {
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
      } else {
        const extracted = extractMediaFromContent(rawContent);
        content = extracted.cleanedContent;
        mediaUrl = extracted.mediaUrl;
        mediaType = extracted.mediaType;
      }

      if (!content?.trim() && !mediaUrl) {
        req.session.error = "Post must contain text or media.";
        return res.redirect("/posts");
      }

      await prisma.post.create({
        data: {
          content: content?.trim() || "",
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
      const existingLike = await prisma.like.findFirst({
        where: { postId, userId },
      });

      let liked;

      if (existingLike) {
        await prisma.like.delete({
          where: { id: existingLike.id },
        });
        liked = false;
      } else {
        await prisma.like.create({
          data: { postId, userId },
        });
        liked = true;
      }

      const likesCount = await prisma.like.count({
        where: { postId },
      });

      res.json({ likesCount, liked });

    } catch (err) {
      console.error("Error liking/unliking post:", err);
      res.status(500).json({ error: "Failed to like/unlike post" });
    }
  },

  // Helper to get a post by ID (for routes)
  async getById(id) {
    const post = await prisma.post.findUnique({
      where: { id: Number(id) },
      include: {
        author: true,
        likes: true,
        comments: { include: { author: true } },
      },
    });

    if (!post) return null;

    return {
      ...post,
      author: post.author
        ? {
            ...post.author,
            avatar: post.author.profileImage || DEFAULT_AVATAR,
          }
        : null,

      comments: post.comments.map(comment => ({
        ...comment,
        author: comment.author
          ? {
              ...comment.author,
              avatar: comment.author.profileImage || DEFAULT_AVATAR,
            }
          : {
              id: null,
              username: "Unknown",
              avatar: DEFAULT_AVATAR,
            },
      })),
    };
  },
};

export default postController;
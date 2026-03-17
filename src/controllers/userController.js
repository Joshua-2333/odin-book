// src/controllers/userController.js

import { PrismaClient } from "@prisma/client";
import uploadAvatar from "../middleware/uploadAvatar.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AVATAR_DIR = path.join(__dirname, "../public/avatars");

const prisma = new PrismaClient();
const DEFAULT_AVATAR = "/avatars/default.png";

const userController = {

  // GET /users
  async index(req, res) {
    try {
      const currentUserId = req.user?.id;

      const users = await prisma.user.findMany({
        where: { id: { not: currentUserId } },
        include: { followers: { where: { status: "ACCEPTED" } } },
        orderBy: { username: "asc" }
      });

      const usersWithFollowStatus = users.map(user => ({
        ...user,
        avatar: user.profileImage || DEFAULT_AVATAR,
        isFollowing: user.followers.some(f => f.followerId === currentUserId)
      }));

      res.render("users/index", {
        users: usersWithFollowStatus,
        currentUser: {
          ...req.user,
          avatar: req.user?.profileImage || DEFAULT_AVATAR
        },
        success: req.session.success,
        error: req.session.error
      });

      req.session.success = null;
      req.session.error = null;

    } catch (err) {
      console.error("User index error:", err);
      req.session.error = "Failed to load users.";
      res.render("users/index", {
        users: [],
        currentUser: {
          ...req.user,
          avatar: req.user?.profileImage || DEFAULT_AVATAR
        }
      });
    }
  },

  // GET /users/:id
  async profile(req, res) {
    const profileUserId = Number(req.params.id);

    const profileUser = await prisma.user.findUnique({
      where: { id: profileUserId },
      include: {
        posts: {
          include: {
            likes: true,
            comments: { include: { author: true }, orderBy: { createdAt: "asc" } }
          },
          orderBy: { createdAt: "desc" }
        },
        followers: { where: { status: "ACCEPTED" } },
        following: { where: { status: "ACCEPTED" } }
      }
    });

    if (!profileUser) {
      req.session.error = "User not found.";
      return res.redirect("/posts");
    }

    let isFollowing = false;
    let isOwnProfile = false;

    if (req.user && !req.user.guest) {
      isOwnProfile = req.user.id === profileUserId;
      if (!isOwnProfile) {
        const follow = await prisma.follow.findFirst({
          where: {
            followerId: req.user.id,
            followingId: profileUserId,
            status: "ACCEPTED"
          }
        });
        isFollowing = Boolean(follow);
      }
    }

    const postsWithAvatars = profileUser.posts.map(post => ({
      ...post,
      author: {
        ...profileUser,
        avatar: profileUser.profileImage || DEFAULT_AVATAR
      },
      comments: post.comments.map(comment => ({
        ...comment,
        author: {
          ...comment.author,
          avatar: comment.author?.profileImage || DEFAULT_AVATAR
        }
      }))
    }));

    res.render("users/profile", {
      profileUser: {
        ...profileUser,
        avatar: profileUser.profileImage || DEFAULT_AVATAR
      },
      posts: postsWithAvatars,
      followersCount: profileUser.followers.length,
      followingCount: profileUser.following.length,
      isFollowing,
      isOwnProfile,
      currentUser: {
        ...req.user,
        avatar: req.user?.profileImage || DEFAULT_AVATAR
      },
      success: req.session.success,
      error: req.session.error
    });

    req.session.success = null;
    req.session.error = null;
  },

  // GET /users/:id/followers
  async followers(req, res) {
    const profileUserId = Number(req.params.id);

    const profileUser = await prisma.user.findUnique({
      where: { id: profileUserId },
      include: {
        followers: {
          where: { status: "ACCEPTED" },
          include: { follower: true }
        }
      }
    });

    if (!profileUser) {
      req.session.error = "User not found.";
      return res.redirect("/posts");
    }

    const followers = profileUser.followers.map(f => ({
      ...f.follower,
      avatar: f.follower.profileImage || DEFAULT_AVATAR
    }));

    res.render("users/followers", {
      profileUser: {
        ...profileUser,
        avatar: profileUser.profileImage || DEFAULT_AVATAR
      },
      followers,
      currentUser: {
        ...req.user,
        avatar: req.user?.profileImage || DEFAULT_AVATAR
      }
    });
  },

  // GET /users/:id/following
  async following(req, res) {
    const profileUserId = Number(req.params.id);

    const profileUser = await prisma.user.findUnique({
      where: { id: profileUserId },
      include: {
        following: {
          where: { status: "ACCEPTED" },
          include: { following: true }
        }
      }
    });

    if (!profileUser) {
      req.session.error = "User not found.";
      return res.redirect("/posts");
    }

    const following = profileUser.following.map(f => ({
      ...f.following,
      avatar: f.following.profileImage || DEFAULT_AVATAR
    }));

    res.render("users/following", {
      profileUser: {
        ...profileUser,
        avatar: profileUser.profileImage || DEFAULT_AVATAR
      },
      following,
      currentUser: {
        ...req.user,
        avatar: req.user?.profileImage || DEFAULT_AVATAR
      }
    });
  },

  // POST /users/profile/avatar
  updateAvatar: [
    async (req, res) => {
      uploadAvatar.single("avatar")(req, res, async (err) => {
        if (err) {
          console.error("Multer upload error:", err);
          return res.status(400).json({
            error: err.message || "Avatar upload failed."
          });
        }

        try {
          await fs.mkdir(AVATAR_DIR, { recursive: true });

          if (!req.file) {
            return res.status(400).json({
              error: "No file uploaded."
            });
          }

          const avatarPath = `/avatars/${req.file.filename}`;

          // Get current user
          const user = await prisma.user.findUnique({
            where: { id: req.user.id }
          });

          if (!user) {
            return res.status(404).json({
              error: "User not found."
            });
          }

          // Delete old avatar if exists and is not default
          if (user.profileImage && user.profileImage !== DEFAULT_AVATAR) {
            const oldPath = path.join(
              AVATAR_DIR,
              path.basename(user.profileImage)
            );

            try {
              await fs.unlink(oldPath);
            } catch (unlinkErr) {
              console.warn("Failed to delete old avatar:", unlinkErr.message);
            }
          }

          // Update user avatar
          const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: { profileImage: avatarPath }
          });

          return res.json({
            avatarUrl: updatedUser.profileImage
          });

        } catch (err) {
          console.error("Avatar update error:", err);

          return res.status(500).json({
            error: err.message || "Failed to update avatar"
          });
        }
      });
    }
  ]
};

export default userController;
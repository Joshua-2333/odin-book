// src/controllers/userController.js

import { PrismaClient } from "@prisma/client";
import uploadAvatar from "../middleware/uploadAvatar.js";

const prisma = new PrismaClient();

const DEFAULT_AVATAR = "/avatars/default.png";

const userController = {

  // GET /users
  async index(req, res) {
    try {

      const currentUserId = req.user?.id;

      const users = await prisma.user.findMany({
        where: {
          id: { not: currentUserId },
        },
        include: {
          followers: {
            where: { status: "ACCEPTED" },
          },
        },
        orderBy: { username: "asc" },
      });

      const usersWithFollowStatus = users.map((user) => ({
        ...user,
        avatar: user.avatar || DEFAULT_AVATAR,
        isFollowing: user.followers.some(
          (follow) => follow.followerId === currentUserId
        ),
      }));

      res.render("users/index", {
        users: usersWithFollowStatus,
        currentUser: {
          ...req.user,
          avatar: req.user?.avatar || DEFAULT_AVATAR,
        },
        success: req.session.success,
        error: req.session.error,
      });

      req.session.success = null;
      req.session.error = null;

    } catch (err) {

      console.error("User index error:", err);

      req.session.error = "Failed to load users.";

      res.render("users/index", {
        users: [],
        currentUser: req.user,
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
            comments: {
              include: { author: true },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        followers: {
          where: { status: "ACCEPTED" },
        },
        following: {
          where: { status: "ACCEPTED" },
        },
      },
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
            status: "ACCEPTED",
          },
        });

        isFollowing = Boolean(follow);
      }
    }

    // Normalize avatars in posts + comments
    const postsWithAvatars = profileUser.posts.map((post) => ({
      ...post,
      comments: post.comments.map((comment) => ({
        ...comment,
        author: {
          ...comment.author,
          avatar: comment.author?.avatar || DEFAULT_AVATAR,
        }
      }))
    }));

    res.render("users/profile", {
      profileUser: {
        ...profileUser,
        avatar: profileUser.avatar || DEFAULT_AVATAR,
      },
      posts: postsWithAvatars,
      followersCount: profileUser.followers.length,
      followingCount: profileUser.following.length,
      isFollowing,
      isOwnProfile,
      currentUser: {
        ...req.user,
        avatar: req.user?.avatar || DEFAULT_AVATAR,
      },
      success: req.session.success,
      error: req.session.error,
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
          include: { follower: true },
        },
      },
    });

    if (!profileUser) {
      req.session.error = "User not found.";
      return res.redirect("/posts");
    }

    const followers = profileUser.followers.map((f) => ({
      ...f.follower,
      avatar: f.follower.avatar || DEFAULT_AVATAR,
    }));

    res.render("users/followers", {
      profileUser: {
        ...profileUser,
        avatar: profileUser.avatar || DEFAULT_AVATAR,
      },
      followers,
      currentUser: {
        ...req.user,
        avatar: req.user?.avatar || DEFAULT_AVATAR,
      },
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
          include: { following: true },
        },
      },
    });

    if (!profileUser) {
      req.session.error = "User not found.";
      return res.redirect("/posts");
    }

    const following = profileUser.following.map((f) => ({
      ...f.following,
      avatar: f.following.avatar || DEFAULT_AVATAR,
    }));

    res.render("users/following", {
      profileUser: {
        ...profileUser,
        avatar: profileUser.avatar || DEFAULT_AVATAR,
      },
      following,
      currentUser: {
        ...req.user,
        avatar: req.user?.avatar || DEFAULT_AVATAR,
      },
    });
  },

  // POST /users/profile/avatar
  updateAvatar: [

    uploadAvatar.single("avatar"),

    async (req, res) => {

      try {

        if (!req.file) {
          req.session.error = "No file uploaded.";
          return res.redirect(`/users/${req.user.id}`);
        }

        const avatarPath = `/avatars/${req.file.filename}`;

        await prisma.user.update({
          where: { id: req.user.id },
          data: { avatar: avatarPath },
        });

        req.session.success = "Avatar updated!";
        res.redirect(`/users/${req.user.id}`);

      } catch (err) {

        console.error("Avatar upload error:", err);

        req.session.error = "Failed to update avatar.";
        res.redirect(`/users/${req.user.id}`);
      }
    },
  ],
};

export default userController;

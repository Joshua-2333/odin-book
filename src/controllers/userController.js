// src/controllers/userController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

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
            where: {
              status: "ACCEPTED",
            },
          },
        },
        orderBy: { username: "asc" },
      });

      const usersWithFollowStatus = users.map(user => ({
        ...user,
        isFollowing: user.followers.some(
          follow => follow.followerId === currentUserId
        ),
      }));

      res.render("users/index", {
        users: usersWithFollowStatus,
        currentUser: req.user,
        success: req.session.success,
        error: req.session.error,
      });

      req.session.success = null;
      req.session.error = null;
    } catch (err) {
      console.error(err);
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

    res.render("users/profile", {
      profileUser,
      posts: profileUser.posts,
      followersCount: profileUser.followers.length,
      followingCount: profileUser.following.length,
      isFollowing,
      isOwnProfile,
      currentUser: req.user,
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
          include: {
            follower: true,
          },
        },
      },
    });

    if (!profileUser) {
      req.session.error = "User not found.";
      return res.redirect("/posts");
    }

    res.render("users/followers", {
      profileUser,
      followers: profileUser.followers.map(f => f.follower),
      currentUser: req.user,
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
          include: {
            following: true,
          },
        },
      },
    });

    if (!profileUser) {
      req.session.error = "User not found.";
      return res.redirect("/posts");
    }

    res.render("users/following", {
      profileUser,
      following: profileUser.following.map(f => f.following),
      currentUser: req.user,
    });
  },
};

export default userController;

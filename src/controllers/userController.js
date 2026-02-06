// src/controllers/userController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const userController = {
  // GET /users/:id
  async profile(req, res) {
    const profileUserId = Number(req.params.id);

    const profileUser = await prisma.user.findUnique({
      where: { id: profileUserId },
      include: {
        posts: {
          include: {
            likes: true,
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
    });
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
    });
  },
};

export default userController;

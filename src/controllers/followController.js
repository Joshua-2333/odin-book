// src/controllers/followController.js
import { PrismaClient, FollowStatus } from "@prisma/client";

const prisma = new PrismaClient();

const followController = {
  // POST /users/:id/follow
  async follow(req, res) {
    const targetId = Number(req.params.id);
    const currentUserId = req.user.id;

    // Prevent self-follow
    if (targetId === currentUserId) {
      req.session.error = "You cannot follow yourself.";
      return res.redirect(`/users/${targetId}`);
    }

    // Ensure target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!targetUser) {
      req.session.error = "User not found.";
      return res.redirect("/posts");
    }

    try {
      await prisma.follow.create({
        data: {
          followerId: currentUserId,
          followingId: targetId,
          status: FollowStatus.ACCEPTED, // auto-accept for now
        },
      });

      req.session.success = "User followed!";
    } catch (err) {
      // Unique constraint violation = already following
      console.error(err);
      req.session.error = "You are already following this user.";
    }

    res.redirect(`/users/${targetId}`);
  },

  // POST /users/:id/unfollow
  async unfollow(req, res) {
    const targetId = Number(req.params.id);
    const currentUserId = req.user.id;

    // Prevent self-unfollow (hardening)
    if (targetId === currentUserId) {
      req.session.error = "You cannot unfollow yourself.";
      return res.redirect(`/users/${targetId}`);
    }

    try {
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetId,
          },
        },
      });

      req.session.success = "User unfollowed.";
    } catch (err) {
      console.error(err);
      req.session.error = "You are not following this user.";
    }

    res.redirect(`/users/${targetId}`);
  },
};

export default followController;

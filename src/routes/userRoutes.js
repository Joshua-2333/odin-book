// src/routes/userRoutes.js
import express from "express";
import ensureAuth from "../middleware/ensureAuth.js";
import ensureGuest from "../middleware/ensureGuest.js";
import userController from "../controllers/userController.js";
import followController from "../controllers/followController.js";

const router = express.Router();

// Users index
router.get("/", ensureAuth, userController.index);

// User profile
router.get("/:id", userController.profile);

// Upload avatar
router.post(
  "/profile/avatar",
  ensureAuth,
  userController.updateAvatar
);

// Followers / Following
router.get("/:id/followers", userController.followers);
router.get("/:id/following", userController.following);

// Follow / Unfollow
router.post("/:id/follow", ensureGuest, ensureAuth, followController.follow);
router.post("/:id/unfollow", ensureGuest, ensureAuth, followController.unfollow);

export default router;
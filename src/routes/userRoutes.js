// src/routes/userRoutes.js

import express from "express";
import ensureAuth from "../middleware/ensureAuth.js";
import userController from "../controllers/userController.js";
import followController from "../controllers/followController.js";

const router = express.Router();

// Users index
router.get("/", ensureAuth, userController.index);

// Avatar upload (must be before /:id)
router.post(
  "/profile/avatar",
  ensureAuth,
  userController.updateAvatar
);

// User profile
router.get("/:id", ensureAuth, userController.profile);

// Followers / Following
router.get("/:id/followers", ensureAuth, userController.followers);
router.get("/:id/following", ensureAuth, userController.following);

// Follow / Unfollow
router.post("/:id/follow", ensureAuth, followController.follow);
router.post("/:id/unfollow", ensureAuth, followController.unfollow);

export default router;
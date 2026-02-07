// src/routes/userRoutes.js
import express from "express";
import ensureAuth from "../middleware/ensureAuth.js";
import ensureGuest from "../middleware/ensureGuest.js";
import userController from "../controllers/userController.js";
import followController from "../controllers/followController.js";

const router = express.Router();

// NEW: Users index page (auth only)
router.get("/", ensureAuth, userController.index);

// View user profile (guests allowed)
router.get("/:id", userController.profile);

// Followers / Following lists
router.get("/:id/followers", userController.followers);
router.get("/:id/following", userController.following);

// Follow a user (auth only)
router.post("/:id/follow", ensureGuest, ensureAuth, followController.follow);

// Unfollow a user (auth only)
router.post("/:id/unfollow", ensureGuest, ensureAuth, followController.unfollow);

export default router;

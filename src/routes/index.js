// src/routes/index.js
import express from "express";
import authRoutes from "./authRoutes.js";
import postRoutes from "./postRoutes.js";

const router = express.Router();

// Mount auth routes
router.use("/", authRoutes);

// Mount posts routes
router.use("/posts", postRoutes);

// Home page (guests see login, users redirect to posts)
router.get("/", (req, res) => {
  if (req.user && !req.user.guest) {
    return res.redirect("/posts");
  }
  res.render("auth/login"); // guests/new users
});

export default router;

// src/routes/index.js
import express from "express";
import authRoutes from "./authRoutes.js";

const router = express.Router();

// Mount auth routes
router.use("/", authRoutes);

// Temporary home page (redirect to posts if logged in)
router.get("/", (req, res) => {
  if (req.user && !req.user.guest) {
    return res.redirect("/posts");
  }
  res.render("auth/login"); // redirect guest/new users to login page
});

export default router;

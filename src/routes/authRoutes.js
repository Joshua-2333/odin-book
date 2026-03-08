// src/routes/authRoutes.js
import express from "express";
import bcrypt from "bcrypt";
import passport from "../config/passport.js";
import { PrismaClient } from "@prisma/client";
import authController from "../controllers/authController.js";

const prisma = new PrismaClient();
const router = express.Router();


// Register page
router.get("/register", authController.registerPage);


// Register user
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.render("auth/register", {
      error: "All fields are required.",
      layout: false,
    });
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: email.toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      return res.render("auth/register", {
        error: "Username or email already taken.",
        layout: false,
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        email: email.toLowerCase(),
        passwordHash,
      },
    });

    req.login(user, (err) => {
      if (err) {
        console.error(err);
        return res.render("auth/register", {
          error: "Login failed after registration.",
          layout: false,
        });
      }

      res.redirect("/posts");
    });

  } catch (err) {
    console.error(err);
    res.render("auth/register", {
      error: "Something went wrong.",
      layout: false,
    });
  }
});


// Login page
router.get("/login", authController.loginPage);


// Login user
router.post(
  "/login",
  (req, res, next) => {
    if (req.body.identifier?.includes("@")) {
      req.body.identifier = req.body.identifier.toLowerCase();
    }
    next();
  },
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureMessage: "Invalid username/email or password.",
  }),
  (req, res) => {
    res.redirect("/posts");
  }
);


// Logout
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/login");
  });
});


// Guest login
router.get("/guest", (req, res) => {
  req.user = {
    id: `guest-${req.sessionID}`,
    username: "Guest",
    guest: true,
  };

  res.redirect("/posts");
});


export default router;
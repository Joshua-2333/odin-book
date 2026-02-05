// src/routes/authRoutes.js
import express from "express";
import bcrypt from "bcrypt";
import passport from "../config/passport.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// Register 
router.get("/register", (req, res) => {
  res.render("auth/register", { error: null });
});

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.render("auth/register", {
      error: "All fields are required.",
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
        });
      }
      res.redirect("/posts");
    });
  } catch (err) {
    console.error(err);
    res.render("auth/register", {
      error: "Something went wrong.",
    });
  }
});

// Login 
router.get("/login", (req, res) => {
  res.render("auth/login", {
    error: req.session.error || null,
  });
});

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

// Guest 
router.get("/guest", (req, res) => {
  req.user = {
    id: `guest-${req.sessionID}`,
    username: "Guest",
    guest: true,
  };
  res.redirect("/posts");
});

export default router;

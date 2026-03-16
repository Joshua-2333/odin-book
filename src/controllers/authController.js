// src/controllers/authController.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEFAULT_AVATAR = "/avatars/default.png";

const authController = {
  // GET /login
  loginPage(req, res) {
    res.render("auth/login", {
      title: "Login",
      layout: false, // disable main layout so header is not duplicated
      error: req.session.error,
      success: req.session.success,
    });

    req.session.error = null;
    req.session.success = null;
  },

  // GET /register
  registerPage(req, res) {
    res.render("auth/register", {
      title: "Register",
      layout: false, // disable main layout
      error: req.session.error,
      success: req.session.success,
    });

    req.session.error = null;
    req.session.success = null;
  },

  // POST /login
  async login(req, res) {
    const { email, password } = req.body;

    const isAjax =
      req.xhr ||
      req.headers["x-requested-with"] === "XMLHttpRequest" ||
      req.headers.accept?.includes("application/json");

    // Validate required fields
    if (!email?.trim() || !password?.trim()) {
      const message = "Email and password are required.";
      if (isAjax) return res.status(400).json({ error: message });
      req.session.error = message;
      return res.redirect("/login");
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        const message = "Invalid email or password.";
        if (isAjax) return res.status(401).json({ error: message });
        req.session.error = message;
        return res.redirect("/login");
      }

      // Login successful
      req.session.userId = user.id;
      req.session.success = "Logged in successfully.";

      if (isAjax) return res.json({ success: true, userId: user.id });
      return res.redirect("/posts");
    } catch (err) {
      console.error("Login error:", err);
      const message = "Server error. Try again.";
      if (isAjax) return res.status(500).json({ error: message });
      req.session.error = message;
      return res.redirect("/login");
    }
  },

  // POST /register
  async register(req, res) {
    const { username, email, password, confirmPassword } = req.body;

    const isAjax =
      req.xhr ||
      req.headers["x-requested-with"] === "XMLHttpRequest" ||
      req.headers.accept?.includes("application/json");

    // Required fields
    if (!username?.trim() || !email?.trim() || !password || !confirmPassword) {
      const message = "All fields are required.";
      if (isAjax) return res.status(400).json({ error: message });
      req.session.error = message;
      return res.redirect("/register");
    }

    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      const message = "Invalid email format.";
      if (isAjax) return res.status(400).json({ error: message });
      req.session.error = message;
      return res.redirect("/register");
    }

    // Password confirmation
    if (password !== confirmPassword) {
      const message = "Passwords do not match.";
      if (isAjax) return res.status(400).json({ error: message });
      req.session.error = message;
      return res.redirect("/register");
    }

    // Password length
    if (password.length < 6) {
      const message = "Password must be at least 6 characters long.";
      if (isAjax) return res.status(400).json({ error: message });
      req.session.error = message;
      return res.redirect("/register");
    }

    try {
      // Check if email or username already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email.trim().toLowerCase() },
            { username: username.trim() },
          ],
        },
      });

      if (existingUser) {
        const message = "Email or username already in use.";
        if (isAjax) return res.status(400).json({ error: message });
        req.session.error = message;
        return res.redirect("/register");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const newUser = await prisma.user.create({
        data: {
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          avatar: DEFAULT_AVATAR,
        },
      });

      req.session.userId = newUser.id;
      req.session.success = "Account created successfully.";

      if (isAjax) return res.status(201).json({ success: true, userId: newUser.id });
      return res.redirect("/posts");

    } catch (err) {
      console.error("Register error:", err);
      const message = "Server error. Try again.";
      if (isAjax) return res.status(500).json({ error: message });
      req.session.error = message;
      return res.redirect("/register");
    }
  },

  // GET /logout
  logout(req, res) {
    req.session.destroy(() => {
      res.redirect("/login");
    });
  },
};

export default authController;
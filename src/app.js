// src/app.js
import express from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import path from "path";
import dotenv from "dotenv";

import passport, { guestMiddleware } from "./config/passport.js";
import sessionConfig from "./config/session.js";
import routes from "./routes/index.js";

dotenv.config();

const app = express();

// View engine 
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src/views"));

// Body parsing 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files 
app.use(express.static(path.join(process.cwd(), "src/public")));

// Sessions 
const PGStore = pgSession(session);
app.use(session(sessionConfig(PGStore)));

// Passport 
app.use(passport.initialize());
app.use(passport.session());

// Guest middleware 
app.use(guestMiddleware);

// Flash + locals
app.use((req, res, next) => {
  res.locals.currentUser = req.user || null;
  res.locals.success = req.session.success || null;
  res.locals.error = req.session.error || null;

  delete req.session.success;
  delete req.session.error;
  next();
});

// Routes 
app.use("/", routes);

// 404
app.use((req, res) => {
  res.status(404).render("partials/404", {
    title: "Page Not Found",
  });
});

export default app;

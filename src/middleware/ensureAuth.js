// src/middleware/ensureAuth.js
export default function ensureAuth(req, res, next) {
  if (req.isAuthenticated() || req.user) {
    return next();
  }

  req.session.error = "You must be logged in to view that page.";
  res.redirect("/login");
}

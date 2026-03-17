// src/middleware/ensureAuth.js
export default function ensureAuth(req, res, next) {
  const isRealAuthenticatedUser =
    req.isAuthenticated?.() &&
    req.user &&
    !req.user.guest;

  if (isRealAuthenticatedUser) {
    return next();
  }

  req.session.error = "You must be logged in to view that page.";

  const wantsJSON =
    req.xhr ||
    req.headers.accept?.includes("json") ||
    req.originalUrl.includes("/profile/avatar");

  if (wantsJSON) {
    return res.status(401).json({
      error: "You must be logged in."
    });
  }

  return res.redirect("/login");
}
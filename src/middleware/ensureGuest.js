// src/middleware/ensureGuest.js
export default function ensureGuest(req, res, next) {
  if (req.user && req.user.guest) {
    req.session.error =
      "Guests cannot perform this action. Please register or log in.";
    return res.redirect("/login");
  }

  next();
}

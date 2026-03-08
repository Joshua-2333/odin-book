// src/controllers/authController.js

const authController = {
  // GET /login
  loginPage(req, res) {
    res.render("auth/login", {
      title: "Login",
      layout: false, // disable main layout so header is not duplicated
    });
  },

  // GET /register
  registerPage(req, res) {
    res.render("auth/register", {
      title: "Register",
      layout: false, // disable main layout
    });
  },
};

export default authController;
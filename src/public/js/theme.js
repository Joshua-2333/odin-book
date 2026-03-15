// src/public/js/theme.js
const toggle = document.getElementById("theme-toggle");

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark-mode");
  if (toggle) toggle.textContent = "☀️";
}

toggle?.addEventListener("click", () => {

  document.body.classList.toggle("dark-mode");

  const isDark = document.body.classList.contains("dark-mode");

  localStorage.setItem("theme", isDark ? "dark" : "light");

  toggle.textContent = isDark ? "☀️" : "🌙";

});
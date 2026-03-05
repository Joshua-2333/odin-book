// src/public/js/main.js

document.addEventListener("DOMContentLoaded", () => {
  /*Flash message auto-dismiss*/
  const flashSuccess = document.getElementById("flash-success");
  const flashError = document.getElementById("flash-error");

  if (flashSuccess || flashError) {
    setTimeout(() => {
      [flashSuccess, flashError].forEach(el => {
        if (!el) return;

        el.classList.add("flash-hide");

        // Remove from DOM after animation
        setTimeout(() => {
          el.remove();
        }, 800);
      });
    }, 4000);
  }
});

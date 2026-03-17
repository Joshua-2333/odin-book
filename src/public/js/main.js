// src/public/js/main.js

document.addEventListener("DOMContentLoaded", () => {

  /* Flash message auto-dismiss */
  const flashSuccess = document.getElementById("flash-success");
  const flashError = document.getElementById("flash-error");

  if (flashSuccess || flashError) {
    setTimeout(() => {
      [flashSuccess, flashError].forEach(el => {
        if (!el) return;
        el.classList.add("flash-hide");
        setTimeout(() => el.remove(), 800);
      });
    }, 4000);
  }

  // --- Avatar live preview and update ---
  const avatarInput = document.getElementById("avatar-input");
  const avatarPreview = document.getElementById("avatar-preview");
  const avatarForm = document.getElementById("avatar-form");

  if (!avatarInput || !avatarPreview || !avatarForm) return;

  // Preview image before upload
  avatarInput.addEventListener("change", () => {
    const file = avatarInput.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      avatarInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      avatarPreview.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Upload avatar
  avatarForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = avatarInput.files[0];
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch("/users/profile/avatar", {
        method: "POST",
        body: formData,
        headers: {
          "Accept": "application/json"
        }
      });

      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      if (!isJson) {
        const text = await res.text();
        console.error("Unexpected non-JSON response from server:", text);
        throw new Error("Server returned a non-JSON response.");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Avatar upload failed.");
      }

      if (!data?.avatarUrl) {
        throw new Error("Invalid server response: missing avatarUrl.");
      }

      // Prevent browser caching old avatar
      const newUrl = `${data.avatarUrl}?t=${Date.now()}`;

      document.querySelectorAll(".avatar, .avatar-large").forEach(img => {
        img.src = newUrl;
      });

      avatarInput.value = "";

    } catch (err) {
      console.error("Avatar upload error:", err);
      alert(err.message || "Avatar upload failed.");
    }
  });

});
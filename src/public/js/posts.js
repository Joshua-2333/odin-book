// src/public/js/posts.js
document.addEventListener("DOMContentLoaded", () => {

  // ------------------ Likes ------------------
  document.querySelectorAll(".like-btn").forEach((btn) => {

    btn.addEventListener("click", async () => {

      const postId = btn.dataset.postId;
      const likesCountSpan = btn.querySelector(".post-likes");

      if (!likesCountSpan) {
        console.error("Like counter not found for post", postId);
        return;
      }

      try {
        const res = await fetch(`/posts/${postId}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });

        const data = await res.json();

        if (!res.ok) {
          console.error(data.error || "Like request failed");
          return;
        }

        // Update like counter
        likesCountSpan.textContent = data.likesCount;

        // Toggle button state (color and aria)
        btn.classList.toggle("liked", data.liked);
        btn.setAttribute("aria-pressed", data.liked);

      } catch (err) {
        console.error("Error liking post:", err);
      }

    });

  });

  // ------------------ Comments ------------------
  document.querySelectorAll(".comment-form").forEach((form) => {

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const postId = form.dataset.postId;
      const input = form.querySelector('input[name="content"]');
      const content = input.value.trim();
      if (!content) return;

      try {
        const res = await fetch(`/posts/${postId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content })
        });

        if (!res.ok) {
          alert("Failed to post comment");
          return;
        }

        const comment = await res.json();

        const commentList = form.closest(".comments").querySelector(".comment-list");

        const div = document.createElement("div");
        div.className = "comment";

        div.innerHTML = `
          <img src="${comment.author.avatar || '/avatars/default.png'}" class="avatar-small" alt="${comment.author.username} avatar">
          <strong>
            <a href="/users/${comment.author.id}" class="comment-author">
              ${comment.author.username}
            </a>
          </strong>
          <span>${comment.content}</span>
        `;

        commentList.appendChild(div);

        input.value = "";

        // Also update the comment counter in the post meta
        const toggle = document.querySelector(`[aria-controls="comments-${postId}"]`);
        if (toggle) {
          const currentCount = parseInt(toggle.textContent.match(/\d+/)[0]);
          toggle.textContent = `💬 ${currentCount + 1} Comments`;
        }

        // Open comments if not already open
        const commentsSection = form.closest(".comments");
        if (!commentsSection.classList.contains("open")) {
          commentsSection.classList.add("open");
          if (toggle) toggle.setAttribute("aria-expanded", true);
        }

      } catch (err) {
        console.error("Error posting comment:", err);
        alert("Error posting comment");
      }

    });

  });

  // ------------------ Comment Toggle ------------------
  document.querySelectorAll(".comment-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {

      const commentsSection = document.getElementById(
        toggle.getAttribute("aria-controls")
      );

      if (!commentsSection) return;

      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", !expanded);
      commentsSection.classList.toggle("open");

    });

    toggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle.click();
      }
    });
  });

});
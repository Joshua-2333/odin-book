// src/public/js/mediaPreview.js
const input = document.getElementById("media");
const preview = document.getElementById("media-preview");

if (input) {
  input.addEventListener("change", () => {
    preview.innerHTML = "";

    const file = input.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    if (file.type.startsWith("video")) {
      const video = document.createElement("video");
      video.src = url;
      video.controls = true;
      video.style.maxWidth = "100%";
      preview.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = url;
      img.style.maxWidth = "100%";
      preview.appendChild(img);
    }
  });
}
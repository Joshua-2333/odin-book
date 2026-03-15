// src/middleware/uploadAvatar.js

import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

/*
  Needed because __dirname does not exist in ES modules
*/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
  Storage configuration
*/
const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/avatars"));
  },

  filename: (req, file, cb) => {

    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname));

  }

});

/*
  File filter for security
  Only allow images
*/
const fileFilter = (req, file, cb) => {

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }

};

/*
  Upload middleware
*/
const uploadAvatar = multer({

  storage,
  fileFilter,

  limits: {
    fileSize: 2 * 1024 * 1024 
  }

});

export default uploadAvatar;
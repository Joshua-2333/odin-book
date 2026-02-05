// src/config/session.js
import dotenv from "dotenv";
dotenv.config();

export default function (PGStore) {
  return {
    store: new PGStore({
      conString: process.env.DATABASE_URL,
      tableName: "session",
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  };
}

// src/config/passport.js
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Local Strategy
// Allow login with username OR email
passport.use(
  new LocalStrategy(
    { usernameField: "identifier", passwordField: "password" },
    async (identifier, password, done) => {
      try {
        // Find user by username OR email
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: identifier },
              { email: identifier.toLowerCase() },
            ],
          },
        });

        if (!user) {
          return done(null, false, { message: "Invalid credentials" });
        }

        // Compare password
        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
          return done(null, false, { message: "Invalid credentials" });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Serialize user to session 
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session 
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return done(null, false);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Guest user middleware 
// If user is not logged in, create a temporary guest session
export function guestMiddleware(req, res, next) {
  if (!req.isAuthenticated()) {
    // Assign guest session (in-memory)
    req.user = {
      id: `guest-${req.sessionID}`,
      username: "Guest",
      guest: true,
    };
  }
  next();
}

export default passport;

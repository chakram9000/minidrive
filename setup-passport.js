import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { prisma } from "./lib/prisma.js";
import bcrypt from "bcryptjs";

export function setup_passport() {
  passport.use(
    new LocalStrategy(
      { usernameField: "username" },
      async (username, password, done) => {
        try {
          const user = await prisma.user.findUnique({
            where: { username },
          });

          if (!user) {
            return done(null, false, {
              message: "Incorrect username or it doesn't exist",
            });
          }

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: "Incorrect password" });
          }

          done(null, user);
        } catch (err) {
          done(err);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}

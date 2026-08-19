import { matchedData, validationResult } from "express-validator";
import { validateSignup } from "../validators/auth.js";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import passport from "passport";
import bcrypt from "bcryptjs";

const router = Router();

router.get("/signup", (_, res) => {
  res.render("signup");
});

router.get("/login", (req, res) => {
  res.render("login", { errorsMessages: req.session.errors });
});

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

router.post("/signup", validateSignup, async (req, res) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).render("signup", { errors: result.array() });
  }

  const { username, password } = matchedData(req);
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      username: username,
      password: hashedPassword,
      rootDir: { create: { name: "root" } },
    },
  });

  res.redirect("/");
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureMessage: true,
  }),
);

export default router;

import "dotenv/config";
import express from "express";
import path from "path";
import { setup_passport } from "./setup-passport.js";
import expressSession from "express-session";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { prisma } from "./lib/prisma.js";
import passport from "passport";
import authRouter from "./routes/auth.js";
import indexRouter from "./routes/index.js";
import driveRouter from "./routes/drive.js";

setup_passport();

const app = express();

// @TODO!: revise when is <%= (escaping) used throughout the template files.
// @TODO: error page?
app.set("views", path.join(import.meta.dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(import.meta.dirname, "public")));
app.use(
  expressSession({
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 5 * 60 * 1000, // 5 mins
    }),
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }, // 7 days
  }),
);
app.use(passport.session());
app.use(express.urlencoded({ extended: true }));

// this is mainly for ejs
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

app.get("/", indexRouter);
app.use("/", authRouter);
app.use("/drive", driveRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, (err) => {
  if (err) throw err;
  console.log(`Minidrive running at port ${PORT}`);
});

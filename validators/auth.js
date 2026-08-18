import { body } from "express-validator";

// for auth protected routes
export const validateAuth = (req, res, next) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  next();
};

export const validateSignup = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 64 })
    .withMessage("Username must be between 3 and 64 characters"),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 64 })
    .withMessage("Password must be between 8 and 64 characters"),
  body("password2")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords must match"),
];

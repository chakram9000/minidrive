import { body } from "express-validator";

export const validateFolderName = body("folder_name")
  .trim()
  .notEmpty()
  .withMessage("Folder name is required")
  .isAlphanumeric(undefined, { ignore: /[\s_]/g })
  .withMessage(
    "Folder name can only contain alphanumeric, whitespace, and _ characters",
  )
  .isLength({ max: 128 })
  .withMessage("Folder name can only be 128 characters long");

export const validateFileName = body("file_name")
  .trim()
  .notEmpty()
  .withMessage("Filename is required")
  .isLength({ max: 128 })
  .withMessage("Filename can only be 128 characters long")
  .custom((value) => {
    if (value === "." || value === "..") {
      throw new Error('Filename cannot be "." or ".."');
    }
    if (/[. ]$/.test(value)) {
      throw new Error("Filename cannot end with a space or period");
    }
    return true;
  })
  .escape();

export const validateShareDir = [
  body("expires_at")
    .isDate()
    .withMessage("Must be a valid date")
    .custom((value) => {
      const date = new Date(value);
      if (date.getTime() <= Date.now() + 1 * 60 * 60 * 1000) {
        throw new Error("Must be at least 1 hour in the future");
      }

      return true;
    }),
];

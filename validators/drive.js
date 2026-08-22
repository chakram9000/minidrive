import { body } from "express-validator";

export const validateFolderCreationForm = [
  body("folder_name")
    .trim()
    .notEmpty()
    .withMessage("Folder name is required")
    .isAlphanumeric(undefined, { ignore: /[\s_]/ })
    .withMessage(
      "Folder name can only contain alphanumeric, whitespace, and _ characters",
    )
    .isLength({ max: 128 })
    .withMessage("Folder name can only be 128 characters long"),
];

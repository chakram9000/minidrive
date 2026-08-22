//
// i tried to copy google drive's routing, play around with their site to find out how it works.
//

// @TODO: removing folders
// @TODO: removing files
// @TODO: renaming folders
// @TODO: renaming files
import { Router } from "express";
import { validateAuth } from "../validators/auth.js";
import { prisma } from "../lib/prisma.js";
import multer from "multer";
import path from "path";
import { validateFolderCreationForm } from "../validators/drive.js";
import { matchedData, validationResult } from "express-validator";

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, _file, cb) => {
    const uuid = crypto.randomUUID();
    cb(null, uuid);
  },
});
const upload = multer({ storage: storage });

const router = Router();

router.get("/{folders}", validateAuth, (req, res) =>
  res.redirect(req.baseUrl + "/folders/home"),
);

router.get("/folders/home", validateAuth, async (req, res) => {
  try {
    // using findFirst when it should be findUnique, but prisma is trash and thinks you need
    // a direct attribute to be unique.
    const subdrive = await prisma.directory.findFirst({
      where: {
        rootOwner: { id: req.user.id },
      },
      include: {
        files: true,
        subDirs: true,
      },
    });

    if (subdrive.ownerId !== req.user.id) {
      return res.status(401).send("Unauthorized.");
    }

    if (!subdrive) {
      throw Error(
        `couldn't find the root drive somehow, user id is ${req.user.id}`,
      );
    }

    res.render("drive", { subdrive });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send("An error occured, we couldn't fetch your drive...");
  }
});

router.get("/folders/:id", validateAuth, async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id);
    const subdrive = await prisma.directory.findUnique({
      where: {
        id: id,
      },
      include: {
        files: true,
        subDirs: true,
      },
    });

    if (subdrive.ownerId !== req.user.id) {
      return res.status(401).send("Unauthorized.");
    }

    if (!subdrive)
      throw Error(`couldn't find the subdrive somehow, id is ${req.params.id}`);

    res.render("drive", { subdrive });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send("An error occured, we couldn't fetch your drive...");
  }
});

router.get("/files/:uuid", validateAuth, async (req, res) => {
  try {
    const fileMetadata = await prisma.file.findUnique({
      where: {
        uuid: req.params.uuid,
      },
    });

    if (fileMetadata.ownerId !== req.user.id) {
      return res.status(401).send("Unauthorized.");
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileMetadata.name}"`,
    );

    const rootPath = path.join(import.meta.dirname, "..", "uploads/");
    res.sendFile(req.params.uuid, { root: rootPath }, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).send("File not found!");
      }
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send("An error occured, we couldn't upload that file...");
  }
});

router.post(
  "/upload-file/:parent_id",
  validateAuth,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).send("Tried to upload nothing.");
    }

    const parentFolderID = Number.parseInt(req.params.parent_id);
    if (isNaN(parentFolderID)) {
      return res.status(400).send("Invalid directory id.");
    }

    try {
      const alreadyExistingFile = await prisma.file.findFirst({
        where: {
          parentDirId: parentFolderID,
          name: req.file.originalname,
        },
      });
      if (alreadyExistingFile) {
        return res
          .status(400)
          .send("File already exists. We haven't implemented overriding...");
      }

      await prisma.file.create({
        data: {
          uuid: req.file.filename,
          name: req.file.originalname,
          parentDirId: parentFolderID,
          size: req.file.size,
          ownerId: req.user.id,
        },
      });

      res.redirect(req.baseUrl + "/folders/" + req.params.folder_id);
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .send("An error occured, we couldn't upload that file...");
    }
  },
);

router.post(
  "/create-folder/:parent_id",
  validateAuth,
  validateFolderCreationForm,
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // @TODO: put errors next to the form
      return res.status(400).send(result.array());
    }

    const { folder_name } = matchedData(req);

    try {
      const parentFolderID = Number.parseInt(req.params.parent_id);
      if (isNaN(parentFolderID)) {
        return res.status(400).send("Invalid directory id.");
      }

      const alreadyExistingDir = await prisma.directory.findFirst({
        where: {
          parentDirId: parentFolderID,
          name: folder_name,
        },
      });
      if (alreadyExistingDir) {
        return res
          .status(400)
          .send("There exists a directory with the same name.");
      }

      const newDir = await prisma.directory.create({
        data: {
          name: folder_name,
          parentDirId: parentFolderID,
          ownerId: req.user.id,
        },
      });

      res.redirect(req.baseUrl + "/folders/" + newDir.id);
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .send("An error occured, we couldn't create that directory...");
    }
  },
);

export default router;

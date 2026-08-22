//
// i tried to copy google drive's routing, play around with their site to find out how it works.
//

import { Router } from "express";
import { validateAuth } from "../validators/auth.js";
import { prisma } from "../lib/prisma.js";
import multer from "multer";
import path from "path";

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

    console.log(subdrive); // @TEMP

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

    console.log(subdrive); // @TEMP

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
  "/upload-file/:folder_id",
  validateAuth,
  upload.single("file"),
  async (req, res) => {
    console.log(req.file); // @TEMP
    if (!req.file) {
      return res.status(400).send("Tried to upload nothing.");
    }

    const folderID = Number.parseInt(req.params.folder_id);
    if (isNaN(folderID)) {
      return res.status(400).send("Invalid directory id.");
    }

    try {
      const fileAlreadyExists = await prisma.file.findFirst({
        where: {
          parentDirId: folderID,
          name: req.file.originalname,
        },
      });
      if (fileAlreadyExists) {
        return res
          .status(400)
          .send("File already exists. We haven't implemented overriding...");
      }

      await prisma.file.create({
        data: {
          uuid: req.file.filename,
          name: req.file.originalname,
          parentDirId: folderID,
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

export default router;

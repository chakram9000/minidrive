//
// i tried to copy google drive's routing, play around with their site to find out how it works.
//

import { Router } from "express";
import { validateAuth } from "../validators/auth.js";
import { prisma } from "../lib/prisma.js";
import {
  validateFileName,
  validateFolderName,
  validateShareDir,
} from "../validators/drive.js";
import { matchedData, validationResult } from "express-validator";
import { upload, supabase } from "../lib/storage.js";

const router = Router();

router.get("/{folders}", validateAuth, (req, res) =>
  res.redirect(req.baseUrl + "/folders/home"),
);

router.get("/folders/home", validateAuth, async (req, res) => {
  try {
    const userInDB = await prisma.user.findUniqueOrThrow({
      where: { id: req.user.id },
      include: {
        rootDir: {
          include: {
            files: true,
            subDirs: {
              include: {
                sharedDirectory: true,
              },
            },
            sharedDirectory: true,
          },
        },
      },
    });

    const subdrive = userInDB.rootDir;
    if (!subdrive) {
      throw Error(
        `couldn't find the root drive somehow, user id is ${req.user.id}`,
      );
    }

    res.render("drive", { subdrive, isRoot: true });
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
    const subdrive = await prisma.directory.findUniqueOrThrow({
      where: {
        id: id,
      },
      include: {
        files: true,
        subDirs: {
          include: {
            sharedDirectory: true,
          },
        },
        sharedDirectory: true,
      },
    });

    if (subdrive.ownerId !== req.user.id) {
      return res.status(401).send("Unauthorized.");
    }

    if (!subdrive)
      throw Error(`couldn't find the subdrive somehow, id is ${req.params.id}`);

    res.render("drive", { subdrive, isRoot: subdrive.parentDirId === null });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send("An error occured, we couldn't fetch your drive...");
  }
});

router.get("/download/:uuid", validateAuth, async (req, res) => {
  try {
    const fileMetadata = await prisma.file.findUniqueOrThrow({
      where: {
        uuid: req.params.uuid,
      },
    });

    if (fileMetadata.ownerId !== req.user.id) {
      return res.status(401).send("Unauthorized.");
    }

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET_NAME)
      .createSignedUrl(req.params.uuid, 30, { download: fileMetadata.name });

    if (error) {
      console.error(
        `Error while downloading file ${req.params.uuid}: ${error}`,
      );
      return res.status(500).send("Couldn't download that file...");
    }

    res.redirect(data.signedUrl);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send("An error occured, we couldn't download that file...");
  }
});

router.get("/file-info/:uuid", validateAuth, async (req, res) => {
  try {
    const file = await prisma.file.findUniqueOrThrow({
      where: {
        uuid: req.params.uuid,
      },
      include: {
        owner: true,
      },
    });

    if (file.ownerId !== req.user.id) {
      return res.status(401).send("Unauthorized.");
    }

    res.render("file-info", {
      file,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send("An error occured, we couldn't view that file...");
  }
});

router.get("/share/:dir_id", validateAuth, async (req, res) => {
  try {
    const dirId = Number.parseInt(req.params.dir_id);
    const dir = await prisma.directory.findUniqueOrThrow({
      where: {
        id: dirId,
      },
    });

    if (dir.ownerId !== req.user.id) {
      return res.status(401).send("Unauthorized.");
    }

    res.render("share", { dir });
  } catch (err) {
    console.error(err);
    return res.status(500).send("An error occured.");
  }
});

/* Disabled for now
router.get("/file-move-up/:uuid", validateAuth, async (req, res) => {
  try {
    const fileUUID = req.params.uuid;

    const file = await prisma.file.findUniqueOrThrow({
      where: {
        uuid: fileUUID,
      },
      include: {
        parentDir: true,
      },
    });

    if (file.ownerId !== req.user.id) {
      return res.status(401).send("Unauthorized.");
    }

    const isParentRoot = file.parentDir.parentDirId === null;
    if (isParentRoot) {
      return res.status(400).send("Can't do that!");
    }

    await prisma.file.update({
      where: {
        uuid: fileUUID,
      },
      data: {
        parentDirId: file.parentDir.parentDirId,
      },
    });

    res.redirect(req.baseUrl + "/folders/" + file.parentDirId);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send("An error occured, we couldn't move that file up...");
  }
});

router.get("/folder-move-up/:id", validateAuth, async (req, res) => {
  try {
    const folderId = Number.parseInt(req.params.id);

    const folder = await prisma.directory.findUniqueOrThrow({
      where: {
        id: folderId,
      },
      include: {
        parentDir: true,
      },
    });

    if (folder.ownerId !== req.user.id) {
      return res.status(401).send("Unauthorized.");
    }

    const isSelfOrParentRoot =
      !folder.parentDir || folder.parentDir.parentDirId === null;
    if (isSelfOrParentRoot) {
      return res.status(400).send("Can't do that!");
    }

    await prisma.directory.update({
      where: {
        id: folderId,
      },
      data: {
        parentDirId: folder.parentDir.id,
      },
    });

    res.redirect(req.baseUrl + "/folders/" + folder.parentDirId);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send("An error occured, we couldn't move that folder up...");
  }
});
*/

router.post(
  "/upload-file/:parent_id",
  validateAuth,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send("Tried to upload nothing.");
      }

      const parentFolderID = Number.parseInt(req.params.parent_id);
      if (isNaN(parentFolderID)) {
        return res.status(400).send("Invalid directory id.");
      }

      const parentFolder = await prisma.directory.findUniqueOrThrow({
        where: { id: parentFolderID },
        include: {
          files: {
            where: {
              name: req.file.originalname, // include files that have the same name, should only return zero or one file!
            },
          },
        },
      });

      if (parentFolder.ownerId !== req.user.id) {
        return res.status(401).send("Unauthorized.");
      }

      const doesFileAlreadyExist = parentFolder.files.length > 0;
      if (doesFileAlreadyExist) {
        return res
          .status(400)
          .send("File already exists. We haven't implemented overriding...");
      }

      const newFileUUID = crypto.randomUUID();

      const { error } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET_NAME)
        .upload(newFileUUID, req.file.buffer);

      if (error) {
        console.error(`Error while uploading file: ${error}`);
        return res.status(500).send("Couldn't upload that file...");
      }

      await prisma.file.create({
        data: {
          uuid: newFileUUID,
          name: req.file.originalname,
          parentDirId: parentFolderID,
          size: req.file.size,
          ownerId: req.user.id,
        },
      });

      res.redirect(req.baseUrl + "/folders/" + parentFolderID);
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
  validateFolderName,
  async (req, res) => {
    try {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        // @TODO: put errors next to the form
        return res.status(400).send(result.array());
      }

      const { folder_name } = matchedData(req);
      const parentFolderID = Number.parseInt(req.params.parent_id);
      if (isNaN(parentFolderID)) {
        return res.status(400).send("Invalid directory id.");
      }

      const parentFolder = await prisma.directory.findUniqueOrThrow({
        where: {
          id: parentFolderID,
        },
        include: {
          subDirs: {
            where: {
              // include subdirs that have the same name, should only return zero or one subdir!
              parentDirId: parentFolderID,
              name: folder_name,
            },
          },
        },
      });

      if (parentFolder.ownerId !== req.user.id) {
        return res.status(401).send("Unauthorized.");
      }

      const doesDirAlreadyExist = parentFolder.subDirs.length > 0;
      if (doesDirAlreadyExist) {
        return res
          .status(400)
          .send("There exists a directory with the same name.");
      }

      await prisma.directory.create({
        data: {
          name: folder_name,
          parentDirId: parentFolderID,
          ownerId: req.user.id,
        },
      });

      res.redirect(req.baseUrl + "/folders/" + parentFolderID);
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .send("An error occured, we couldn't create that directory...");
    }
  },
);

router.post(
  "/rename-file/:uuid",
  validateAuth,
  validateFileName,
  async (req, res) => {
    try {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        // @TODO: put errors next to the form
        return res.status(400).send(result.array());
      }

      const { file_name } = matchedData(req);

      const fileUUID = req.params.uuid;

      const file = await prisma.file.findUniqueOrThrow({
        where: {
          uuid: fileUUID,
        },
      });

      if (file.ownerId !== req.user.id) {
        return res.status(401).send("Unauthorized.");
      }

      await prisma.file.update({
        where: {
          uuid: fileUUID,
        },
        data: {
          name: file_name,
        },
      });

      res.redirect(req.baseUrl + "/folders/" + file.parentDirId);
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .send("An error occured, we couldn't update that file's name...");
    }
  },
);

router.post(
  "/rename-folder/:id",
  validateAuth,
  validateFolderName,
  async (req, res) => {
    try {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        // @TODO: put errors next to the form
        return res.status(400).send(result.array());
      }

      const { folder_name } = matchedData(req);

      const folderId = Number.parseInt(req.params.id);
      if (isNaN(folderId)) {
        return res.status(400).send("Invalid directory id.");
      }

      const folder = await prisma.directory.findUniqueOrThrow({
        where: {
          id: folderId,
        },
      });

      if (folder.ownerId !== req.user.id) {
        return res.status(401).send("Unauthorized.");
      }

      await prisma.directory.update({
        where: {
          id: folderId,
        },
        data: {
          name: folder_name,
        },
      });

      res.redirect(req.baseUrl + "/folders/" + folder.parentDirId);
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .send("An error occured, we couldn't update that directory's name...");
    }
  },
);

router.post("/delete-file/:uuid", validateAuth, async (req, res) => {
  try {
    const fileUUID = req.params.uuid;
    const fileToDelete = await prisma.file.findUniqueOrThrow({
      where: {
        uuid: fileUUID,
      },
    });

    if (fileToDelete.ownerId !== req.user.id) {
      return res.status(401).send("Unauthorized.");
    }

    // delete row first to ensure its existence, it will just throw if not existing.
    await prisma.file.delete({
      where: {
        uuid: fileUUID,
      },
    });

    // then delete from storage
    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET_NAME)
      .remove([fileToDelete.uuid]);

    if (error) {
      // we just print error and continue.
      console.error("Error while deleting file:", fileToDelete.uuid, error);
    }

    res.redirect(req.baseUrl + "/folders/" + fileToDelete.parentDirId);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send("An error occured, we couldn't delete that file...");
  }
});

router.post("/delete-folder/:id", validateAuth, async (req, res) => {
  try {
    const folderId = Number.parseInt(req.params.id);
    if (isNaN(folderId)) {
      return res.status(400).send("Invalid directory id.");
    }

    const folderToDelete = await prisma.directory.findUniqueOrThrow({
      where: {
        id: folderId,
      },
    });

    if (folderToDelete.ownerId !== req.user.id) {
      return res.status(401).send("Unauthorized.");
    }

    // first, get all files nested inside this dir,
    // we get them using a recursive CTE (needs a raw query).
    // this is to get all of their uuids to remove them from the actual storage.
    const files = await prisma.$queryRaw`
			WITH RECURSIVE nested_dirs AS (
				SELECT id FROM "Directory"
				WHERE id = ${folderId}
				UNION ALL
				SELECT d.id
				FROM "Directory" d
				JOIN nested_dirs n
				ON d."parentDirId" = n.id
			)
			SELECT * FROM "File"
			WHERE "parentDirId" IN (SELECT id FROM nested_dirs)
		`;

    // then, delete them from storage
    if (files && files.length > 0) {
      const { error } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET_NAME)
        .remove(files.map((file) => file.uuid));

      if (error) {
        // we just print error and continue.
        console.error("Error while deleting files:", error);
      }
    }

    // then delete the dir, the dir and file rows in the db will be deleted by cascade.
    await prisma.directory.delete({
      where: {
        id: folderId,
      },
    });

    res.redirect(req.baseUrl);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send("An error occured, we couldn't delete that directory...");
  }
});

router.post(
  "/share/:dir_id",
  validateAuth,
  validateShareDir,
  async (req, res) => {
    try {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        // @TODO: put errors next to the form
        return res.status(400).send(result.array());
      }

      const { expires_at } = matchedData(req);

      const dirId = Number.parseInt(req.params.dir_id);
      const dir = await prisma.directory.findUniqueOrThrow({
        where: {
          id: dirId,
        },
      });

      if (dir.ownerId !== req.user.id) {
        return res.status(401).send("Unauthorized.");
      }

      const sharedDir = await prisma.sharedDirectory.create({
        data: {
          uuid: crypto.randomUUID(),
          dirId: dirId,
          expiresAt: new Date(expires_at),
        },
      });

      res.render("shared-success", { uuid: sharedDir.uuid });
    } catch (err) {
      console.error(err);
      return res.status(500).send("An error occured.");
    }
  },
);

export default router;

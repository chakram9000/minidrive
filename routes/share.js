//
// for shared directories (read only), so little different than drive router.
//

// @TODO: redirect owner of shared dir to the original one, or something else, to allow him to edit.
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { supabase } from "../lib/storage.js";
import { validateSharedUUID } from "../validators/share.js";

const router = Router();

router.get("/:uuid", validateSharedUUID, async (req, res) => {
  res.render("shared-drive", {
    subdrive: req.sharedDirMetadata.dir,
    uuid: req.sharedDirMetadata.uuid,
    isRoot: true,
  });
});

router.get("/:uuid/:id", validateSharedUUID, async (req, res) => {
  try {
    const sharedDirMetadata = req.sharedDirMetadata;

    const requestedSubdirID = Number.parseInt(req.params.id);
    if (sharedDirMetadata.dirId === requestedSubdirID) {
      // if the requested id is the same as the root shared dir, just return it instead of doing all the other checks.
      // this also avoids some ux problems.
      return res.render("shared-drive", {
        subdrive: sharedDirMetadata.dir,
        uuid: sharedDirMetadata.uuid,
        isRoot: true,
      });
    }

    // --- Then check n get the actual requested subdir.
    // @NOTE: this is a terrible way of doing it.
    // We fetch all nested subdirs in the main shared one to make sure that the requested one IS nested,
    // so that he can't access other private dirs. (:id in this route is the absolute id, we don't have relative ones.)
    const allNestedSubdirs = await prisma.directory.$queryRaw`
			WITH RECURSIVE nested_dirs AS (
				SELECT id FROM "Directory"
				WHERE id = ${sharedDirMetadata.dirId}
				UNION ALL
				SELECT d.id
				FROM "Directory" d
				JOIN nested_dirs n
				ON d."parentDirId" = n.id
			)
			SELECT id FROM nested_dirs;
		`;

    if (!allNestedSubdirs.includes({ id: requestedSubdirID })) {
      return res
        .status(404)
        .send("That shared link doesn't exist, or has expired.");
    }

    const subdir = await prisma.directory.findUniqueOrThrow({
      where: {
        id: requestedSubdirID,
      },
      include: {
        files: true,
        subDirs: true,
      },
    });

    res.render("shared-drive", {
      subdrive: subdir,
      uuid: sharedDirMetadata.uuid,
      isRoot: false,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(404)
      .send("That shared link doesn't exist, or has expired.");
  }
});

router.get(
  "/:uuid/download/:file_uuid",
  validateSharedUUID,
  async (req, res) => {
    try {
      const fileMetadata = await prisma.file.findUniqueOrThrow({
        where: {
          uuid: req.params.file_uuid,
        },
      });

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
  },
);

/* not implemented, maybe @TODO: implement this?
router.get("/:uuid/file-info/:file_uuid", validateSharedUUID, async (req, res) => {
  try {
    const file = await prisma.file.findUniqueOrThrow({
      where: {
        uuid: req.params.file_uuid,
      },
      include: {
        owner: {
          omit: {
            id: true,
            password: true,
            rootDirId: true,
          },
        },
      },
    });

    res.render("file-info", { file });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send("An error occured, we couldn't view that file...");
  }
});
*/

export default router;

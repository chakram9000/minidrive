import { Router } from "express";
import { validateAuth } from "../validators/auth.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", validateAuth, (req, res) => {
  res.redirect(req.baseUrl + "/files");
});

router.get("/files{/*path}", validateAuth, async (req, res) => {
  const requestedDrivePath = req.params.path;
  const didRequestRoot = !requestedDrivePath || requestedDrivePath.length === 0;

  let subdrive;
  if (didRequestRoot) {
    // using findFirst when it should be findUnique, but prisma is trash and thinks you need
    // a direct attribute to be unique.
    subdrive = await prisma.directory.findFirst({
      where: {
        rootOwner: { id: req.user.id },
      },
    });
  } else {
    subdrive = await prisma.directory.findUnique({
      where: {
        full_path: requestedDrivePath,
      },
    });
  }

  if (!subdrive) {
    return res
      .status(500)
      .send("An error occured, we couldn't fetch your drive...");
  }

  console.log(subdrive);

  res.render("drive", { subdrive });
});

export default router;

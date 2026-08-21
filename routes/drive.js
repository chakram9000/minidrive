//
// we try to copy google drive's routing, play around with their site to find out how it works.
//

import { Router } from "express";
import { validateAuth } from "../validators/auth.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", validateAuth, (req, res) => {
  res.redirect(req.baseUrl + "/files");
});

router.get("/folders{/}", validateAuth, (_, res) =>
  res.redirect("/folders/home"),
);

router.get("/folders/home", validateAuth, async (req, res) => {
  try {
    // using findFirst when it should be findUnique, but prisma is trash and thinks you need
    // a direct attribute to be unique.
    const subdrive = await prisma.directory.findFirst({
      where: {
        rootOwner: { id: req.user.id },
      },
    });

    if (!subdrive)
      throw Error(
        `couldn't find the root drive somehow, user id is ${req.user.id}`,
      );

    // @TEMP
    console.log(subdrive);

    res.render("drive", { subdrive });
  } catch (err) {
    return res
      .status(500)
      .send("An error occured, we couldn't fetch your drive...");
  }
});

router.get("/folders/:id", validateAuth, async (req, res) => {
  try {
    const subdrive = await prisma.directory.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!subdrive)
      throw Error(`couldn't find the subdrive somehow, id is ${req.params.id}`);

    // @TEMP
    console.log(subdrive);

    res.render("drive", { subdrive });
  } catch (err) {
    return res
      .status(500)
      .send("An error occured, we couldn't fetch your drive...");
  }
});

export default router;

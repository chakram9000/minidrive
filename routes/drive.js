import { Router } from "express";
import { validateAuth } from "../validators/auth.js";

const router = Router();

router.get("/", validateAuth, (req, res) => {
  res.redirect(req.baseUrl + "/files");
});

router.get("/files{/*path}", validateAuth, (req, res) => {
  // @TODO: fetch based on path
  console.dir(req.params.path);

  res.render("drive", { subdrive: [] });
});

export default router;

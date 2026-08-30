import { prisma } from "../lib/prisma.js";

export const validateSharedUUID = async (req, res, next) => {
  try {
    const sharedDirMetadata = await prisma.sharedDirectory.findUniqueOrThrow({
      where: {
        uuid: req.params.uuid,
      },
      include: {
        dir: {
          include: {
            files: true,
            subDirs: true,
          },
        },
      },
    });

    if (sharedDirMetadata.expiresAt.getTime() <= Date.now()) {
      // expired and somehow not deleted from db, guess the cron job wasn't fast enough, no big deal.
      await prisma.sharedDirectory.delete({
        where: {
          uuid: req.params.uuid,
        },
      });
      return res.status(410).send("Expired.");
    }

    req.sharedDirMetadata = sharedDirMetadata;
    next();
  } catch (err) {
    console.error(err);
    return res
      .status(404)
      .send("That shared link doesn't exist, or has expired.");
  }
};

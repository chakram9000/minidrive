//
// this would be ran as a cron job every 10 mins or so.
//

import { prisma } from "./lib/prisma.js";

async function main() {
  try {
    const expiredRecords = await prisma.sharedDirectory.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });

    console.log("Successfully deleted ", expiredRecords.count, " records.");
  } catch (err) {
    console.error("Error while deleting expired records:", err);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
}

await main();

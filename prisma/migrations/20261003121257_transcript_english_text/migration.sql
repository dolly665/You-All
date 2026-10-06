/*
  Warnings:

  - Added the required column `englishText` to the `Transcript` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transcript" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "englishText" TEXT NOT NULL,
    "segments" TEXT NOT NULL DEFAULT '[]',
    "model" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transcript_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Transcript" ("createdAt", "id", "language", "model", "segments", "sourceId", "text") SELECT "createdAt", "id", "language", "model", "segments", "sourceId", "text" FROM "Transcript";
DROP TABLE "Transcript";
ALTER TABLE "new_Transcript" RENAME TO "Transcript";
CREATE UNIQUE INDEX "Transcript_sourceId_key" ON "Transcript"("sourceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

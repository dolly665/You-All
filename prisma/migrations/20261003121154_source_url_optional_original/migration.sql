-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Source" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "originalPath" TEXT,
    "originalSha256" TEXT,
    "sourceUrl" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "processingStatus" TEXT NOT NULL DEFAULT 'UPLOADED',
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Source" ("createdAt", "errorMessage", "id", "mimeType", "originalPath", "originalSha256", "processingStatus", "sizeBytes", "tags", "title", "updatedAt") SELECT "createdAt", "errorMessage", "id", "mimeType", "originalPath", "originalSha256", "processingStatus", "sizeBytes", "tags", "title", "updatedAt" FROM "Source";
DROP TABLE "Source";
ALTER TABLE "new_Source" RENAME TO "Source";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

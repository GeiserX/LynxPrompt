-- DropForeignKey
ALTER TABLE "KnownDevice" DROP CONSTRAINT "KnownDevice_userId_fkey";

-- DropIndex
DROP INDEX "Session_deviceHash_idx";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "deviceHash",
DROP COLUMN "deviceName",
DROP COLUMN "ipHash",
DROP COLUMN "isNewDevice";

-- DropTable
DROP TABLE "KnownDevice";

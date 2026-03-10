-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'GIF', 'VIDEO');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "mediaType" "MediaType",
ADD COLUMN     "mediaUrl" TEXT;

/*
  Warnings:

  - You are about to drop the `flavors` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "flavors" DROP CONSTRAINT "flavors_productId_fkey";

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "flavors" TEXT[];

-- DropTable
DROP TABLE "flavors";

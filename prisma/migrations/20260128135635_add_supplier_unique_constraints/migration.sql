/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `suppliers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[contact_phone]` on the table `suppliers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,contact_phone]` on the table `suppliers` will be added. If there are existing duplicate values, this will fail.
  - Made the column `contact_phone` on table `suppliers` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `suppliers` MODIFY `contact_phone` VARCHAR(20) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `suppliers_name_key` ON `suppliers`(`name`);

-- CreateIndex
CREATE UNIQUE INDEX `suppliers_contact_phone_key` ON `suppliers`(`contact_phone`);

-- CreateIndex
CREATE UNIQUE INDEX `suppliers_name_contact_phone_key` ON `suppliers`(`name`, `contact_phone`);

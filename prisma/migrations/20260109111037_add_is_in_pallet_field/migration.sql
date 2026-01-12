/*
  Warnings:

  - You are about to drop the `cold_room_pallets` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `cold_room_boxes` ADD COLUMN `converted_to_pallet_at` DATETIME(3) NULL,
    ADD COLUMN `is_in_pallet` BOOLEAN NULL DEFAULT false;

-- DropTable
DROP TABLE `cold_room_pallets`;

-- CreateIndex
CREATE INDEX `cold_room_boxes_is_in_pallet_idx` ON `cold_room_boxes`(`is_in_pallet`);

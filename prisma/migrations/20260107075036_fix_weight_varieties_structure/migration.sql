/*
  Warnings:

  - Made the column `weight` on table `weight_entry_varieties` required. This step will fail if there are existing NULL values in that column.
  - Made the column `crates` on table `weight_entry_varieties` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `weight_entry_varieties` MODIFY `weight` DECIMAL(10, 2) NOT NULL,
    MODIFY `crates` INTEGER NOT NULL DEFAULT 0;

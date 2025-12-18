-- AlterTable
ALTER TABLE `carrier_assignments` ADD COLUMN `transit_completed_at` DATETIME(0) NULL,
    ADD COLUMN `transit_days` INTEGER NULL DEFAULT 0,
    ADD COLUMN `transit_started_at` DATETIME(0) NULL;

-- CreateTable
CREATE TABLE `transit_history` (
    `id` VARCHAR(255) NOT NULL,
    `assignment_id` VARCHAR(255) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `timestamp` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `notes` TEXT NULL,
    `location` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `transit_history_assignment_id_idx`(`assignment_id`),
    INDEX `transit_history_action_idx`(`action`),
    INDEX `transit_history_timestamp_idx`(`timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `packaging_materials` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `currentStock` INTEGER NOT NULL DEFAULT 0,
    `reorderLevel` INTEGER NOT NULL DEFAULT 10,
    `dimensions` VARCHAR(191) NULL,
    `lastUsedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `consumptionRate` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `transit_history` ADD CONSTRAINT `transit_history_assignment_id_fkey` FOREIGN KEY (`assignment_id`) REFERENCES `carrier_assignments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

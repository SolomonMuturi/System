-- CreateTable
CREATE TABLE `carrier_assignments` (
    `id` VARCHAR(20) NOT NULL,
    `carrier_id` VARCHAR(20) NOT NULL,
    `loading_sheet_id` VARCHAR(255) NOT NULL,
    `assigned_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `assigned_by` VARCHAR(100) NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'assigned',
    `notes` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `carrier_assignments_carrier_id_loading_sheet_id_key`(`carrier_id`, `loading_sheet_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `carrier_assignments` ADD CONSTRAINT `carrier_assignments_carrier_id_fkey` FOREIGN KEY (`carrier_id`) REFERENCES `carriers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carrier_assignments` ADD CONSTRAINT `carrier_assignments_loading_sheet_id_fkey` FOREIGN KEY (`loading_sheet_id`) REFERENCES `loading_sheets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

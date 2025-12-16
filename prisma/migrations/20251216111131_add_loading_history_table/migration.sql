-- CreateTable
CREATE TABLE `loading_history` (
    `id` VARCHAR(191) NOT NULL,
    `pallet_id` VARCHAR(191) NOT NULL,
    `supplier_name` VARCHAR(191) NULL,
    `cold_room_id` VARCHAR(191) NULL,
    `loaded_weight` DOUBLE NULL,
    `loaded_by` VARCHAR(191) NULL,
    `loaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` VARCHAR(191) NULL,

    INDEX `loading_history_pallet_id_idx`(`pallet_id`),
    INDEX `loading_history_loaded_at_idx`(`loaded_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

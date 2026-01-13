-- CreateTable
CREATE TABLE `rejects` (
    `id` VARCHAR(191) NOT NULL,
    `weight_entry_id` VARCHAR(191) NULL,
    `pallet_id` VARCHAR(191) NOT NULL,
    `supplier_name` VARCHAR(191) NOT NULL,
    `driver_name` VARCHAR(191) NULL,
    `vehicle_plate` VARCHAR(191) NULL,
    `region` VARCHAR(191) NULL,
    `fuerte_weight` DECIMAL(10, 2) NULL,
    `fuerte_crates` INTEGER NULL DEFAULT 0,
    `hass_weight` DECIMAL(10, 2) NULL,
    `hass_crates` INTEGER NULL DEFAULT 0,
    `total_rejected_weight` DECIMAL(10, 2) NULL,
    `total_rejected_crates` INTEGER NULL DEFAULT 0,
    `variance` DECIMAL(10, 2) NULL,
    `reason` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `rejected_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `rejects_weight_entry_id_idx`(`weight_entry_id`),
    INDEX `rejects_pallet_id_idx`(`pallet_id`),
    INDEX `rejects_supplier_name_idx`(`supplier_name`),
    INDEX `rejects_rejected_at_idx`(`rejected_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

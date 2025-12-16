-- CreateTable
CREATE TABLE `counting_records` (
    `id` VARCHAR(191) NOT NULL,
    `supplier_id` VARCHAR(191) NULL,
    `supplier_name` VARCHAR(191) NOT NULL,
    `supplier_phone` VARCHAR(191) NULL,
    `region` VARCHAR(191) NULL,
    `pallet_id` VARCHAR(191) NOT NULL,
    `total_weight` DOUBLE NOT NULL,
    `fuerte_4kg_class1` INTEGER NOT NULL DEFAULT 0,
    `fuerte_4kg_class2` INTEGER NOT NULL DEFAULT 0,
    `fuerte_4kg_total` INTEGER NOT NULL DEFAULT 0,
    `fuerte_10kg_class1` INTEGER NOT NULL DEFAULT 0,
    `fuerte_10kg_class2` INTEGER NOT NULL DEFAULT 0,
    `fuerte_10kg_total` INTEGER NOT NULL DEFAULT 0,
    `hass_4kg_class1` INTEGER NOT NULL DEFAULT 0,
    `hass_4kg_class2` INTEGER NOT NULL DEFAULT 0,
    `hass_4kg_total` INTEGER NOT NULL DEFAULT 0,
    `hass_10kg_class1` INTEGER NOT NULL DEFAULT 0,
    `hass_10kg_class2` INTEGER NOT NULL DEFAULT 0,
    `hass_10kg_total` INTEGER NOT NULL DEFAULT 0,
    `counting_data` JSON NOT NULL,
    `submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processed_by` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,

    INDEX `counting_records_supplier_id_idx`(`supplier_id`),
    INDEX `counting_records_pallet_id_idx`(`pallet_id`),
    INDEX `counting_records_submitted_at_idx`(`submitted_at`),
    INDEX `counting_records_supplier_name_idx`(`supplier_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `utility_readings` (
    `id` VARCHAR(20) NOT NULL,
    `date` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `powerOpening` DECIMAL(12, 2) NOT NULL,
    `powerClosing` DECIMAL(12, 2) NOT NULL,
    `powerConsumed` DECIMAL(12, 2) NOT NULL,
    `waterOpening` DECIMAL(12, 2) NOT NULL,
    `waterClosing` DECIMAL(12, 2) NOT NULL,
    `waterConsumed` DECIMAL(12, 2) NOT NULL,
    `generatorStart` VARCHAR(8) NOT NULL,
    `generatorStop` VARCHAR(8) NOT NULL,
    `timeConsumed` VARCHAR(50) NOT NULL,
    `dieselConsumed` DECIMAL(10, 2) NOT NULL,
    `dieselRefill` DECIMAL(10, 2) NULL,
    `recordedBy` VARCHAR(100) NULL,
    `shift` VARCHAR(20) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `counting_records` ADD CONSTRAINT `counting_records_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `weight_entries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

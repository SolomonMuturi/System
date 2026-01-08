-- AlterTable
ALTER TABLE `counting_records` ADD COLUMN `bank_account` VARCHAR(50) NULL,
    ADD COLUMN `bank_name` VARCHAR(100) NULL,
    ADD COLUMN `hass_10kg_class1` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `hass_10kg_class2` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `hass_10kg_total` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `hass_4kg_class1` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `hass_4kg_class2` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `hass_4kg_total` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `kra_pin` VARCHAR(20) NULL;

-- AlterTable
ALTER TABLE `quality_checks` ADD COLUMN `hass_class1` DECIMAL(5, 2) NULL,
    ADD COLUMN `hass_class2` DECIMAL(5, 2) NULL,
    ADD COLUMN `hass_overall` DECIMAL(5, 2) NULL;

-- AlterTable
ALTER TABLE `weight_entries` ADD COLUMN `bank_account` VARCHAR(50) NULL,
    ADD COLUMN `bank_name` VARCHAR(100) NULL,
    ADD COLUMN `hass_crates` INTEGER NULL DEFAULT 0,
    ADD COLUMN `hass_weight` DECIMAL(10, 2) NULL,
    ADD COLUMN `kra_pin` VARCHAR(20) NULL,
    ADD COLUMN `perVarietyWeights` TEXT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE `supplier_checkins` (
    `id` VARCHAR(191) NOT NULL,
    `supplier_id` VARCHAR(191) NOT NULL,
    `driver_name` VARCHAR(191) NOT NULL,
    `phone_number` VARCHAR(191) NOT NULL,
    `id_number` VARCHAR(191) NOT NULL,
    `vehicle_plate` VARCHAR(191) NOT NULL,
    `fruit_varieties` TEXT NOT NULL,
    `region` VARCHAR(191) NULL,
    `check_in_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `check_out_time` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'checked_in',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `supplier_checkins_supplier_id_idx`(`supplier_id`),
    INDEX `supplier_checkins_vehicle_plate_idx`(`vehicle_plate`),
    INDEX `supplier_checkins_check_in_time_idx`(`check_in_time`),
    INDEX `supplier_checkins_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

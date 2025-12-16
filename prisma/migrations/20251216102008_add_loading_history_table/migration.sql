-- AlterTable
ALTER TABLE `counting_records` ADD COLUMN `for_coldroom` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `loaded_to_coldroom_at` DATETIME(3) NULL,
    ADD COLUMN `status` VARCHAR(191) NULL DEFAULT 'pending_coldroom',
    ADD COLUMN `total_counted_weight` DOUBLE NULL,
    ADD COLUMN `totals` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `utility_readings` MODIFY `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- CreateTable
CREATE TABLE `rejection_records` (
    `id` VARCHAR(191) NOT NULL,
    `supplier_id` VARCHAR(191) NULL,
    `supplier_name` VARCHAR(191) NOT NULL,
    `pallet_id` VARCHAR(191) NOT NULL,
    `region` VARCHAR(191) NULL,
    `total_intake_weight` DOUBLE NOT NULL,
    `total_counted_weight` DOUBLE NOT NULL,
    `total_rejected_weight` DOUBLE NOT NULL,
    `weight_variance` DOUBLE NOT NULL,
    `variance_level` VARCHAR(191) NOT NULL,
    `crates` LONGTEXT NULL,
    `notes` VARCHAR(191) NULL,
    `counting_data` LONGTEXT NULL,
    `counting_totals` LONGTEXT NULL,
    `submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processed_by` VARCHAR(191) NOT NULL,
    `original_counting_id` VARCHAR(191) NULL,

    INDEX `rejection_records_supplier_name_idx`(`supplier_name`),
    INDEX `rejection_records_pallet_id_idx`(`pallet_id`),
    INDEX `rejection_records_submitted_at_idx`(`submitted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cold_room_boxes` (
    `id` VARCHAR(191) NOT NULL,
    `variety` VARCHAR(191) NOT NULL,
    `box_type` VARCHAR(191) NOT NULL,
    `size` VARCHAR(191) NOT NULL,
    `grade` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `cold_room_id` VARCHAR(191) NOT NULL,
    `counting_record_id` VARCHAR(191) NULL,
    `supplier_name` VARCHAR(191) NULL,
    `pallet_id` VARCHAR(191) NULL,
    `region` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cold_room_boxes_cold_room_id_idx`(`cold_room_id`),
    INDEX `cold_room_boxes_counting_record_id_idx`(`counting_record_id`),
    INDEX `cold_room_boxes_supplier_name_idx`(`supplier_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cold_room_pallets` (
    `id` VARCHAR(191) NOT NULL,
    `variety` VARCHAR(191) NOT NULL,
    `box_type` VARCHAR(191) NOT NULL,
    `size` VARCHAR(191) NOT NULL,
    `grade` VARCHAR(191) NOT NULL,
    `pallet_count` INTEGER NOT NULL DEFAULT 0,
    `cold_room_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_updated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cold_room_pallets_cold_room_id_idx`(`cold_room_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `temperature_logs` (
    `id` VARCHAR(191) NOT NULL,
    `cold_room_id` VARCHAR(191) NOT NULL,
    `temperature` DOUBLE NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `recorded_by` VARCHAR(191) NOT NULL DEFAULT 'Warehouse Staff',

    INDEX `temperature_logs_cold_room_id_idx`(`cold_room_id`),
    INDEX `temperature_logs_timestamp_idx`(`timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `repacking_records` (
    `id` VARCHAR(191) NOT NULL,
    `cold_room_id` VARCHAR(191) NOT NULL,
    `removed_boxes` LONGTEXT NOT NULL,
    `returned_boxes` LONGTEXT NOT NULL,
    `rejected_boxes` INTEGER NOT NULL DEFAULT 0,
    `notes` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processed_by` VARCHAR(191) NOT NULL DEFAULT 'Warehouse Staff',

    INDEX `repacking_records_cold_room_id_idx`(`cold_room_id`),
    INDEX `repacking_records_timestamp_idx`(`timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

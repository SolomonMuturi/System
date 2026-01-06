-- AlterTable
ALTER TABLE `loading_history` ADD COLUMN `counting_record_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `weight_entries` ADD COLUMN `fuerte_crates` INTEGER NULL DEFAULT 0,
    ADD COLUMN `fuerte_weight` DECIMAL(10, 2) NULL DEFAULT 0,
    ADD COLUMN `hass_crates` INTEGER NULL DEFAULT 0,
    ADD COLUMN `hass_weight` DECIMAL(10, 2) NULL DEFAULT 0,
    ADD COLUMN `jumbo_crates` INTEGER NULL DEFAULT 0,
    ADD COLUMN `jumbo_weight` DECIMAL(10, 2) NULL DEFAULT 0,
    ADD COLUMN `mixed_crates` INTEGER NULL DEFAULT 0,
    ADD COLUMN `mixed_weight` DECIMAL(10, 2) NULL DEFAULT 0,
    ADD COLUMN `other_crates` INTEGER NULL DEFAULT 0,
    ADD COLUMN `other_variety` VARCHAR(100) NULL,
    ADD COLUMN `other_weight` DECIMAL(10, 2) NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `weight_entry_varieties` (
    `id` VARCHAR(20) NOT NULL,
    `weight_entry_id` VARCHAR(20) NOT NULL,
    `variety` VARCHAR(100) NOT NULL,
    `weight` DECIMAL(10, 2) NULL,
    `crates` INTEGER NULL DEFAULT 0,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `weight_entry_varieties_weight_entry_id_idx`(`weight_entry_id`),
    INDEX `weight_entry_varieties_variety_idx`(`variety`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `loading_history_counting_record_id_idx` ON `loading_history`(`counting_record_id`);

-- AddForeignKey
ALTER TABLE `weight_entry_varieties` ADD CONSTRAINT `weight_entry_varieties_weight_entry_id_fkey` FOREIGN KEY (`weight_entry_id`) REFERENCES `weight_entries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

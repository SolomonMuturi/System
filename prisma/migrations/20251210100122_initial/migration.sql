-- CreateTable
CREATE TABLE `carriers` (
    `id` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `contact_name` VARCHAR(100) NULL,
    `contact_email` VARCHAR(100) NULL,
    `contact_phone` VARCHAR(20) NULL,
    `rating` FLOAT NULL DEFAULT 0,
    `status` ENUM('Active', 'Inactive', 'Suspended') NOT NULL DEFAULT 'Active',
    `id_number` VARCHAR(50) NULL,
    `vehicle_registration` VARCHAR(20) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `carriers_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `performance` VARCHAR(191) NULL,
    `rating` INTEGER NULL,
    `contract` VARCHAR(191) NOT NULL,
    `salary` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `id_number` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `issue_date` DATETIME(3) NULL,
    `expiry_date` DATETIME(3) NULL,
    `company` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `clockInTime` DATETIME(3) NULL,
    `clockOutTime` DATETIME(3) NULL,
    `designation` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `attendance_employeeId_date_key`(`employeeId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts_receivable` (
    `id` VARCHAR(20) NOT NULL,
    `customer_id` VARCHAR(20) NULL,
    `invoice_id` VARCHAR(100) NULL,
    `amount` DECIMAL(12, 2) NULL,
    `due_date` DATE NULL,
    `aging_status` ENUM('On_Time', 'At_Risk', 'Late') NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `customer_id_idx`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` VARCHAR(20) NOT NULL,
    `user` VARCHAR(100) NULL,
    `avatar` VARCHAR(255) NULL,
    `action` TEXT NULL,
    `ip` VARCHAR(45) NULL,
    `timestamp` DATETIME(0) NULL,
    `status` ENUM('success', 'failure', 'pending') NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `anomalies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `metric_name` VARCHAR(100) NULL,
    `metric_value` DECIMAL(10, 2) NULL,
    `expected_value` DECIMAL(10, 2) NULL,
    `timestamp` DATETIME(0) NULL,
    `additional_context` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cold_room_inventory` (
    `id` VARCHAR(20) NOT NULL,
    `product` VARCHAR(100) NOT NULL,
    `category` ENUM('Fruit', 'Vegetable', 'Flower', 'Other') NOT NULL,
    `quantity` INTEGER NULL,
    `unit` ENUM('pallets', 'tonnes', 'boxes', 'crates') NOT NULL,
    `location` VARCHAR(100) NULL,
    `entry_date` DATETIME(0) NULL,
    `current_weight` DECIMAL(10, 2) NULL,
    `reorder_threshold` DECIMAL(10, 2) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cold_rooms` (
    `id` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `temperature` DECIMAL(4, 1) NULL,
    `humidity` DECIMAL(4, 1) NULL,
    `status` ENUM('Optimal', 'Warning', 'Alert') NOT NULL,
    `zone_type` ENUM('Fruit', 'Vegetable', 'Flower') NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_contacts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` VARCHAR(20) NULL,
    `name` VARCHAR(100) NOT NULL,
    `role` VARCHAR(100) NULL,
    `email` VARCHAR(100) NULL,
    `phone` VARCHAR(20) NULL,
    `is_primary` BOOLEAN NULL DEFAULT false,

    INDEX `customer_id_idx`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `location` VARCHAR(100) NULL,
    `tags` LONGTEXT NULL,
    `logo_url` VARCHAR(255) NULL,
    `website` VARCHAR(100) NULL,
    `ytd_sales` DECIMAL(12, 2) NULL,
    `last_order` DATE NULL,
    `status` ENUM('active', 'inactive', 'new') NOT NULL,
    `outstanding_balance` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `open_invoices` INTEGER NULL DEFAULT 0,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dwell_times` (
    `id` VARCHAR(20) NOT NULL,
    `location` VARCHAR(100) NULL,
    `primary_product` VARCHAR(100) NULL,
    `avg_dwell_time` VARCHAR(50) NULL,
    `items` INTEGER NULL,
    `status` ENUM('optimal', 'moderate', 'high') NOT NULL,
    `next_action` TEXT NULL,
    `entry_date` DATETIME(0) NULL,
    `weight` DECIMAL(10, 2) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `variety` VARCHAR(100) NULL,
    `storage_temp` DECIMAL(4, 1) NULL,
    `category` ENUM('Fruit', 'Vegetable', 'Flower', 'Other') NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotes` (
    `id` VARCHAR(20) NOT NULL,
    `quote_id` VARCHAR(100) NULL,
    `customer_id` VARCHAR(20) NULL,
    `date` DATE NULL,
    `valid_until` DATE NULL,
    `amount` DECIMAL(12, 2) NULL,
    `status` ENUM('Draft', 'Sent', 'Accepted', 'Expired') NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `quotes_quote_id_key`(`quote_id`),
    INDEX `customer_id_idx`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shipments` (
    `id` VARCHAR(20) NOT NULL,
    `shipment_id` VARCHAR(50) NOT NULL,
    `customer_id` VARCHAR(20) NULL,
    `origin` VARCHAR(100) NULL,
    `destination` VARCHAR(100) NULL,
    `status` ENUM('Awaiting_QC', 'Processing', 'Receiving', 'Preparing_for_Dispatch', 'Ready_for_Dispatch', 'In_Transit', 'Delivered', 'Delayed') NOT NULL,
    `product` VARCHAR(100) NULL,
    `tags` VARCHAR(100) NULL,
    `weight` VARCHAR(50) NULL,
    `carrier` VARCHAR(100) NULL,
    `carrier_id` VARCHAR(20) NULL,
    `expected_arrival` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `shipments_shipment_id_key`(`shipment_id`),
    INDEX `customer_id_idx`(`customer_id`),
    INDEX `carrier_id_idx`(`carrier_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `suppliers` (
    `id` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `location` VARCHAR(100) NULL,
    `contact_name` VARCHAR(100) NULL,
    `contact_email` VARCHAR(100) NULL,
    `contact_phone` VARCHAR(20) NULL,
    `produce_types` LONGTEXT NULL,
    `status` ENUM('Active', 'Inactive', 'Onboarding', 'Suspended') NOT NULL,
    `logo_url` VARCHAR(255) NULL,
    `active_contracts` INTEGER NULL DEFAULT 0,
    `kra_pin` VARCHAR(20) NULL,
    `supplier_code` VARCHAR(20) NULL,
    `vehicle_number_plate` VARCHAR(20) NULL,
    `driver_name` VARCHAR(100) NULL,
    `driver_id_number` VARCHAR(50) NULL,
    `mpesa_paybill` VARCHAR(20) NULL,
    `mpesa_account_number` VARCHAR(50) NULL,
    `bank_name` VARCHAR(100) NULL,
    `bank_account_number` VARCHAR(50) NULL,
    `password` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `vehicle_status` VARCHAR(50) NULL DEFAULT 'Pre-registered',
    `vehicle_check_in_time` DATETIME(0) NULL,
    `vehicle_check_out_time` DATETIME(0) NULL,
    `vehicle_type` VARCHAR(50) NULL,
    `cargo_description` LONGTEXT NULL,

    UNIQUE INDEX `suppliers_supplier_code_key`(`supplier_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitors` (
    `id` VARCHAR(191) NOT NULL,
    `visitor_code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `id_number` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `vehicle_plate` VARCHAR(191) NULL,
    `vehicle_type` VARCHAR(191) NULL,
    `cargo_description` VARCHAR(191) NULL,
    `visitor_type` VARCHAR(191) NULL DEFAULT 'visitor',
    `status` VARCHAR(191) NULL DEFAULT 'Pre-registered',
    `check_in_time` DATETIME(3) NULL,
    `check_out_time` DATETIME(3) NULL,
    `expected_check_in_time` DATETIME(3) NULL,
    `host_id` VARCHAR(191) NULL,
    `department` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `visitors_visitor_code_key`(`visitor_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `weight_entries` (
    `id` VARCHAR(20) NOT NULL,
    `pallet_id` VARCHAR(100) NULL,
    `product` VARCHAR(100) NULL,
    `weight` DECIMAL(10, 2) NULL,
    `unit` ENUM('kg', 'lb') NOT NULL,
    `timestamp` DATETIME(0) NULL,
    `supplier` VARCHAR(100) NULL,
    `truck_id` VARCHAR(100) NULL,
    `driver_id` VARCHAR(100) NULL,
    `gross_weight` DECIMAL(10, 2) NULL,
    `tare_weight` DECIMAL(10, 2) NULL,
    `net_weight` DECIMAL(10, 2) NULL,
    `declared_weight` DECIMAL(10, 2) NULL,
    `rejected_weight` DECIMAL(10, 2) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `supplier_id` VARCHAR(255) NULL,
    `supplier_phone` VARCHAR(50) NULL,
    `fruit_variety` TEXT NULL,
    `number_of_crates` INTEGER NULL DEFAULT 0,
    `region` VARCHAR(100) NULL,
    `image_url` TEXT NULL,
    `driver_name` VARCHAR(255) NULL,
    `driver_phone` VARCHAR(50) NULL,
    `driver_id_number` VARCHAR(100) NULL,
    `vehicle_plate` VARCHAR(50) NULL,
    `notes` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quality_checks` (
    `id` VARCHAR(20) NOT NULL,
    `shipment_id` VARCHAR(20) NULL,
    `operator_id` VARCHAR(20) NULL,
    `pallet_id` VARCHAR(100) NULL,
    `product` VARCHAR(100) NULL,
    `declared_weight` DECIMAL(10, 2) NULL,
    `net_weight` DECIMAL(10, 2) NULL,
    `rejected_weight` DECIMAL(10, 2) NULL,
    `accepted_weight` DECIMAL(10, 2) NULL,
    `fuerte_class1` DECIMAL(5, 2) NULL,
    `fuerte_class2` DECIMAL(5, 2) NULL,
    `fuerte_overall` DECIMAL(5, 2) NULL,
    `hass_class1` DECIMAL(5, 2) NULL,
    `hass_class2` DECIMAL(5, 2) NULL,
    `hass_overall` DECIMAL(5, 2) NULL,
    `arrival_temperature` DECIMAL(4, 1) NULL,
    `driver_id` VARCHAR(100) NULL,
    `truck_id` VARCHAR(100) NULL,
    `packaging_status` VARCHAR(50) NULL DEFAULT 'accepted',
    `freshness_status` VARCHAR(50) NULL DEFAULT 'accepted',
    `seals_status` VARCHAR(50) NULL DEFAULT 'accepted',
    `overall_status` VARCHAR(50) NULL DEFAULT 'approved',
    `notes` TEXT NULL,
    `processed_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `processed_by` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `weight_entry_id` VARCHAR(20) NULL,

    INDEX `shipment_id_idx`(`shipment_id`),
    INDEX `weight_entry_id_idx`(`weight_entry_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accounts_receivable` ADD CONSTRAINT `accounts_receivable_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `customer_contacts` ADD CONSTRAINT `customer_contacts_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `quotes` ADD CONSTRAINT `quotes_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_carrier_id_fkey` FOREIGN KEY (`carrier_id`) REFERENCES `carriers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quality_checks` ADD CONSTRAINT `quality_checks_shipment_id_fkey` FOREIGN KEY (`shipment_id`) REFERENCES `shipments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quality_checks` ADD CONSTRAINT `quality_checks_weight_entry_id_fkey` FOREIGN KEY (`weight_entry_id`) REFERENCES `weight_entries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

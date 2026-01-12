-- AddForeignKey
ALTER TABLE `cold_room_boxes` ADD CONSTRAINT `cold_room_boxes_pallet_id_fkey` FOREIGN KEY (`pallet_id`) REFERENCES `cold_room_pallets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

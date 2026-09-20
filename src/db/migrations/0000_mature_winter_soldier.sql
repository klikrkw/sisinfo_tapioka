CREATE TABLE `production_batches` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`number` varchar(50) NOT NULL,
	`date` date NOT NULL,
	`status` enum('Draft','Processing','Completed','Cancelled') DEFAULT 'Draft',
	`notes` text,
	CONSTRAINT `production_batches_id` PRIMARY KEY(`id`),
	CONSTRAINT `production_batches_number_unique` UNIQUE(`number`)
);
--> statement-breakpoint
CREATE TABLE `production_inputs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`batch_id` int NOT NULL,
	`product_id` int NOT NULL,
	`warehouse_id` int NOT NULL,
	`quantity` decimal(15,2) NOT NULL,
	CONSTRAINT `production_inputs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `production_outputs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`batch_id` int NOT NULL,
	`product_id` int NOT NULL,
	`warehouse_id` int NOT NULL,
	`quantity` decimal(15,2) NOT NULL,
	`is_by_product` boolean DEFAULT false,
	`price_per_unit` decimal(15,2) DEFAULT '0',
	CONSTRAINT `production_outputs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('RAW_MATERIAL','FINISHED_GOOD','BY_PRODUCT','PACKAGING') NOT NULL,
	`unit` varchar(20) NOT NULL DEFAULT 'Kg',
	`default_price` decimal(15,2) DEFAULT '0',
	`status` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`number` varchar(50) NOT NULL,
	`date` date NOT NULL,
	`supplier_id` int NOT NULL,
	`raw_material_id` int NOT NULL,
	`warehouse_id` int NOT NULL,
	`gross_weight` decimal(15,2) NOT NULL,
	`tare_weight` decimal(15,2) NOT NULL,
	`net_weight` decimal(15,2) NOT NULL,
	`refaction_percent` decimal(5,2) DEFAULT '0',
	`refaction_weight` decimal(15,2) DEFAULT '0',
	`payable_weight` decimal(15,2) NOT NULL,
	`price_per_kg` decimal(15,2) NOT NULL,
	`base_amount` decimal(15,2) NOT NULL,
	`total_deductions` decimal(15,2) DEFAULT '0',
	`net_amount` decimal(15,2) NOT NULL,
	`status` enum('Draft','Pending','Approved','Completed','Cancelled') DEFAULT 'Draft',
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `purchases_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchases_number_unique` UNIQUE(`number`)
);
--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`warehouse_id` int NOT NULL,
	`product_id` int NOT NULL,
	`type` enum('PURCHASE','PRODUCTION_USAGE','PRODUCTION_OUTPUT','SALE','RETURN','ADJUSTMENT','TRANSFER') NOT NULL,
	`reference_id` int,
	`qty_in` decimal(15,2) DEFAULT '0',
	`qty_out` decimal(15,2) DEFAULT '0',
	`balance` decimal(15,2) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `stock_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('Petani','Pengepul','Distributor','Lainnya') DEFAULT 'Petani',
	`address` text,
	`phone` varchar(50),
	`bank_name` varchar(100),
	`bank_account` varchar(100),
	`bank_account_name` varchar(255),
	`status` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`),
	CONSTRAINT `suppliers_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`role` varchar(50) NOT NULL DEFAULT 'staff',
	`status` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `warehouses` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(50),
	`status` boolean NOT NULL DEFAULT true,
	CONSTRAINT `warehouses_id` PRIMARY KEY(`id`),
	CONSTRAINT `warehouses_code_unique` UNIQUE(`code`)
);

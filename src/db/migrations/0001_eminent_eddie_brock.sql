CREATE TABLE `customers` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text,
	`phone` varchar(50),
	`email` varchar(255),
	`npwp` varchar(50),
	`credit_limit` decimal(15,2) DEFAULT '0',
	`term_days` int DEFAULT 0,
	`status` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `purchase_deduction_types` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`calculation_type` enum('fixed','per_kg','percentage') NOT NULL DEFAULT 'fixed',
	`default_value` decimal(15,2) DEFAULT '0',
	`impact_type` enum('SUPPLIER_DEDUCTION','PURCHASE_COST','PRODUCTION_COST','OTHER') NOT NULL DEFAULT 'SUPPLIER_DEDUCTION',
	`description` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `purchase_deduction_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchase_deduction_types_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `drivers` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text,
	`phone` varchar(50),
	`license_number` varchar(50),
	`license_type` varchar(20),
	`license_expiry` date,
	`status` boolean NOT NULL DEFAULT true,
	CONSTRAINT `drivers_id` PRIMARY KEY(`id`),
	CONSTRAINT `drivers_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`police_number` varchar(20) NOT NULL,
	`brand` varchar(100),
	`type` varchar(100),
	`capacity` decimal(15,2) DEFAULT '0',
	`ownership` enum('Milik Sendiri','Sewa','Pihak Ketiga') DEFAULT 'Milik Sendiri',
	`status` boolean NOT NULL DEFAULT true,
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`),
	CONSTRAINT `vehicles_code_unique` UNIQUE(`code`)
);

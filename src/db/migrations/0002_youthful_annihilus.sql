CREATE TABLE `purchase_deductions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`purchase_id` int NOT NULL,
	`deduction_type_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`calculation_type` enum('fixed','per_kg','percentage') NOT NULL,
	`quantity` decimal(15,2) DEFAULT '0',
	`rate` decimal(15,2) DEFAULT '0',
	`amount` decimal(15,2) NOT NULL,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `purchase_deductions_id` PRIMARY KEY(`id`)
);

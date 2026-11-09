CREATE TABLE `scene_words` (
	`scene_id` int NOT NULL,
	`word_id` int NOT NULL,
	CONSTRAINT `scene_words_scene_id_word_id_pk` PRIMARY KEY(`scene_id`,`word_id`)
);
--> statement-breakpoint
CREATE TABLE `scenes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`sort_order` int NOT NULL,
	`title` varchar(120) NOT NULL,
	`title_ar` varchar(120) NOT NULL,
	`page` int NOT NULL,
	`content` json NOT NULL,
	CONSTRAINT `scenes_id` PRIMARY KEY(`id`),
	CONSTRAINT `scenes_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `user_scenes` (
	`user_id` int NOT NULL,
	`scene_id` int NOT NULL,
	`completed_at` datetime,
	`best_mistakes` int,
	`plays` int NOT NULL DEFAULT 0,
	CONSTRAINT `user_scenes_user_id_scene_id_pk` PRIMARY KEY(`user_id`,`scene_id`)
);
--> statement-breakpoint
CREATE TABLE `user_words` (
	`user_id` int NOT NULL,
	`word_id` int NOT NULL,
	`found_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`box` int NOT NULL DEFAULT 1,
	`due_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`reviews` int NOT NULL DEFAULT 0,
	`lapses` int NOT NULL DEFAULT 0,
	CONSTRAINT `user_words_user_id_word_id_pk` PRIMARY KEY(`user_id`,`word_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(191) NOT NULL,
	`name` varchar(60) NOT NULL,
	`password_hash` varchar(100) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_uq` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `words` (
	`id` int AUTO_INCREMENT NOT NULL,
	`text` varchar(120) NOT NULL,
	`ar` varchar(191) NOT NULL,
	`example` text NOT NULL,
	CONSTRAINT `words_id` PRIMARY KEY(`id`),
	CONSTRAINT `words_text_uq` UNIQUE(`text`)
);
--> statement-breakpoint
ALTER TABLE `scene_words` ADD CONSTRAINT `scene_words_scene_id_scenes_id_fk` FOREIGN KEY (`scene_id`) REFERENCES `scenes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scene_words` ADD CONSTRAINT `scene_words_word_id_words_id_fk` FOREIGN KEY (`word_id`) REFERENCES `words`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_scenes` ADD CONSTRAINT `user_scenes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_scenes` ADD CONSTRAINT `user_scenes_scene_id_scenes_id_fk` FOREIGN KEY (`scene_id`) REFERENCES `scenes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_words` ADD CONSTRAINT `user_words_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_words` ADD CONSTRAINT `user_words_word_id_words_id_fk` FOREIGN KEY (`word_id`) REFERENCES `words`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_words_due_idx` ON `user_words` (`user_id`,`due_at`);
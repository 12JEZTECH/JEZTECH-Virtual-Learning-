CREATE TABLE `conference_passes` (
	`code_hash` text PRIMARY KEY NOT NULL,
	`redeem_by` integer NOT NULL,
	`student_id` text,
	`claimed_at` integer,
	`expires_at` integer,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `conference_student_once` ON `conference_passes` (`student_id`);
--> statement-breakpoint
INSERT INTO conference_passes(code_hash,redeem_by) VALUES('17e534e59f61e87be16984558d50e38d746e2f1358990b0cbdfc1e5dd576f3bc',1793019600000);

--> statement-breakpoint
INSERT INTO conference_passes(code_hash,redeem_by) VALUES('b86a959838bd1b66add183eb8fc670d41e9a340ea22dc21ecdb088ab33e83b21',1793019600000);

--> statement-breakpoint
INSERT INTO conference_passes(code_hash,redeem_by) VALUES('cbbf01645ae033564d8697bf54839b28040e330c7413e8af6a4db8afe91675f9',1793019600000);

--> statement-breakpoint
INSERT INTO conference_passes(code_hash,redeem_by) VALUES('594ba6059861af05c5cdd47ee6d2a266420e00b3b354939ddd99be15d8a20ee5',1793019600000);

--> statement-breakpoint
INSERT INTO conference_passes(code_hash,redeem_by) VALUES('6e05d3bbb7ea28348464358665a560bcee8aea0ed2804315fd13ff20d6160457',1793019600000);

--> statement-breakpoint
INSERT INTO conference_passes(code_hash,redeem_by) VALUES('d6823894c48a328b23825d0cd2da0b19a64506850fdb20e7f74783cb79945f31',1793019600000);

--> statement-breakpoint
INSERT INTO conference_passes(code_hash,redeem_by) VALUES('cf59cc4419faa563db2a4f43f8d3ed58b6dc7a1df04fd409a7b050b4bd193158',1793019600000);

--> statement-breakpoint
INSERT INTO conference_passes(code_hash,redeem_by) VALUES('0532732778672e42df1fec3efde468c904cda2b3512a2cd9524c68cd1cf10238',1793019600000);

--> statement-breakpoint
INSERT INTO conference_passes(code_hash,redeem_by) VALUES('a7a3eccc5af69d074aa3a181fa5323eb3f70dcaadbf52b3cbafca5b9503da3f4',1793019600000);

--> statement-breakpoint
INSERT INTO conference_passes(code_hash,redeem_by) VALUES('e3a9ab23356be7048b7407c8ee56473962fe61a269ecf46a83ac7c599709bf9e',1793019600000);

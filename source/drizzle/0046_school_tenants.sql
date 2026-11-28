CREATE TABLE school_tenants (
 id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE,
 registration_number TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '',
 owner_id TEXT NOT NULL REFERENCES users(id), status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','suspended','rejected')),
 review_note TEXT NOT NULL DEFAULT '', reviewed_by TEXT REFERENCES users(id), reviewed_at INTEGER, created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX schools_owner ON school_tenants(owner_id,created_at);
--> statement-breakpoint
CREATE TABLE school_members (
 school_id TEXT NOT NULL REFERENCES school_tenants(id), user_id TEXT NOT NULL REFERENCES users(id),
 role TEXT NOT NULL CHECK(role IN ('admin','teacher','student')), status TEXT NOT NULL CHECK(status IN ('active','inactive')),
 joined_at INTEGER NOT NULL, PRIMARY KEY(school_id,user_id)
);
--> statement-breakpoint
CREATE INDEX school_member_user ON school_members(user_id,status,school_id);
--> statement-breakpoint
CREATE TABLE school_invites (
 id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL REFERENCES school_tenants(id), email TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('admin','teacher','student')), created_by TEXT NOT NULL REFERENCES users(id),
 created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, accepted_by TEXT REFERENCES users(id), accepted_at INTEGER, revoked_at INTEGER
);
--> statement-breakpoint
CREATE INDEX school_invite_email ON school_invites(email,school_id,expires_at);
--> statement-breakpoint
CREATE TABLE school_classes (
 id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL REFERENCES school_tenants(id), name TEXT NOT NULL,
 class_level TEXT NOT NULL, subject TEXT NOT NULL, teacher_id TEXT NOT NULL, created_at INTEGER NOT NULL,
 UNIQUE(school_id,id), FOREIGN KEY(school_id,teacher_id) REFERENCES school_members(school_id,user_id)
);
--> statement-breakpoint
CREATE INDEX school_class_scope ON school_classes(school_id,teacher_id,created_at);
--> statement-breakpoint
CREATE TABLE school_enrolments (
 school_id TEXT NOT NULL, class_id TEXT NOT NULL, student_id TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('active','removed')),
 created_at INTEGER NOT NULL, PRIMARY KEY(school_id,class_id,student_id),
 FOREIGN KEY(school_id,class_id) REFERENCES school_classes(school_id,id), FOREIGN KEY(school_id,student_id) REFERENCES school_members(school_id,user_id)
);
--> statement-breakpoint
CREATE INDEX school_student_class ON school_enrolments(school_id,student_id,status);
--> statement-breakpoint
CREATE TABLE school_lessons (
 id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL, class_id TEXT NOT NULL, created_by TEXT NOT NULL REFERENCES users(id),
 title TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '', resource_url TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL CHECK(status IN ('draft','live','ended')), duration_minutes INTEGER NOT NULL,
 started_at INTEGER, ends_at INTEGER, created_at INTEGER NOT NULL,
 FOREIGN KEY(school_id,class_id) REFERENCES school_classes(school_id,id)
);
--> statement-breakpoint
CREATE INDEX school_lesson_scope ON school_lessons(school_id,class_id,created_at);
--> statement-breakpoint
CREATE UNIQUE INDEX school_one_live_lesson ON school_lessons(school_id,class_id) WHERE status='live';
--> statement-breakpoint
CREATE TABLE school_posts (
 id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL, class_id TEXT NOT NULL, user_id TEXT NOT NULL REFERENCES users(id),
 body TEXT NOT NULL, created_at INTEGER NOT NULL, FOREIGN KEY(school_id,class_id) REFERENCES school_classes(school_id,id)
);
--> statement-breakpoint
CREATE INDEX school_post_scope ON school_posts(school_id,class_id,created_at);
--> statement-breakpoint
CREATE TABLE school_assignments (
 id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL, class_id TEXT NOT NULL, created_by TEXT NOT NULL REFERENCES users(id),
 title TEXT NOT NULL, questions TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('published','closed')),
 created_at INTEGER NOT NULL, UNIQUE(school_id,id), FOREIGN KEY(school_id,class_id) REFERENCES school_classes(school_id,id)
);
--> statement-breakpoint
CREATE INDEX school_assignment_scope ON school_assignments(school_id,class_id,created_at);
--> statement-breakpoint
CREATE TABLE school_submissions (
 school_id TEXT NOT NULL, assignment_id TEXT NOT NULL, student_id TEXT NOT NULL,
 answers TEXT NOT NULL, score INTEGER NOT NULL, total INTEGER NOT NULL, submitted_at INTEGER NOT NULL,
 PRIMARY KEY(school_id,assignment_id,student_id), FOREIGN KEY(school_id,assignment_id) REFERENCES school_assignments(school_id,id),
 FOREIGN KEY(school_id,student_id) REFERENCES school_members(school_id,user_id)
);
--> statement-breakpoint
CREATE TABLE school_audit (
 id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL REFERENCES school_tenants(id), actor_id TEXT NOT NULL REFERENCES users(id),
 action TEXT NOT NULL, target_id TEXT NOT NULL, created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX school_audit_scope ON school_audit(school_id,created_at);

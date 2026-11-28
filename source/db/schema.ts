import {sql} from 'drizzle-orm';
import { sqliteTable, text, integer, index, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), email: text('email').notNull(), name: text('name').notNull(),
  role: text('role', {enum:['admin','teacher','student']}).notNull().default('student'),
  deletedAt:integer('deleted_at'), disabled: integer('disabled').notNull().default(0), createdAt: integer('created_at').notNull(),
});
export const exams = sqliteTable('exams', {
  id:text('id').primaryKey(), teacherId:text('teacher_id').notNull().references(()=>users.id),
  title:text('title').notNull(), description:text('description').notNull().default(''),
  duration:integer('duration').notNull(), status:text('status').notNull().default('draft'),
  startsAt:integer('starts_at'), endsAt:integer('ends_at'), createdAt:integer('created_at').notNull(),
},t=>[index('exams_teacher').on(t.teacherId)]);
export const questions = sqliteTable('questions', {
  id:text('id').primaryKey(), examId:text('exam_id').notNull().references(()=>exams.id),
  position:integer('position').notNull(), text:text('text').notNull(), choices:text('choices').notNull(), correct:integer('correct').notNull(),
},t=>[uniqueIndex('questions_exam_position').on(t.examId,t.position)]);
export const sessions = sqliteTable('sessions', {
  id:text('id').primaryKey(), examId:text('exam_id').notNull().references(()=>exams.id), studentId:text('student_id').notNull().references(()=>users.id),
  status:text('status').notNull().default('active'), answers:text('answers').notNull().default('{}'),
  warnings:integer('warnings').notNull().default(0), flagged:integer('flagged').notNull().default(0),
  startedAt:integer('started_at').notNull(), deadline:integer('deadline').notNull(), remainingMs:integer('remaining_ms'),
  lastSeen:integer('last_seen').notNull(), endedAt:integer('ended_at'), score:integer('score'), total:integer('total').notNull(),
},t=>[uniqueIndex('session_one_attempt').on(t.examId,t.studentId),index('sessions_state_deadline').on(t.status,t.deadline),index('sessions_learner_status').on(t.studentId,t.status)]);
export const events = sqliteTable('events', {
  id:text('id').primaryKey(), sessionId:text('session_id').notNull().references(()=>sessions.id), actorId:text('actor_id').notNull().references(()=>users.id),
  code:text('code').notNull(), message:text('message').notNull(), at:integer('at').notNull(),
},t=>[index('events_session_time').on(t.sessionId,t.at)]);
export const lessons = sqliteTable('lessons', {
 id:text('id').primaryKey(),classLevel:text('class_level').notNull().default('all'),topic:text('topic').notNull().default(''),teacherId:text('teacher_id').notNull().references(()=>users.id),title:text('title').notNull(),summary:text('summary').notNull(),content:text('content').notNull(),
 subject:text('subject').notNull(),curriculum:text('curriculum').notNull(),price:integer('price').notNull().default(50),status:text('status').notNull().default('published'),createdAt:integer('created_at').notNull(),
},t=>[index('lessons_teacher').on(t.teacherId)]);
export const payments = sqliteTable('payments', {
 id:text('id').primaryKey(),lessonId:text('lesson_id').notNull().references(()=>lessons.id),studentId:text('student_id').notNull().references(()=>users.id),
 phone:text('phone').notNull(),amount:integer('amount').notNull(),receipt:text('receipt').notNull(),status:text('status').notNull().default('pending'),
 reviewedBy:text('reviewed_by').references(()=>users.id),reviewNote:text('review_note').notNull().default(''),createdAt:integer('created_at').notNull(),reviewedAt:integer('reviewed_at'),
},t=>[uniqueIndex('payments_receipt').on(t.receipt),index('payments_student_lesson').on(t.studentId,t.lessonId)]);
export const paymentSettings=sqliteTable('payment_settings',{
 id:text('id').primaryKey(),businessNumber:text('business_number').notNull().default(''),accountReference:text('account_reference').notNull().default(''),instructions:text('instructions').notNull().default(''),updatedAt:integer('updated_at').notNull(),
});
export const labs=sqliteTable('labs',{
 classLevel:text('class_level').notNull().default('all'),topic:text('topic').notNull().default(''),
 id:text('id').primaryKey(),teacherId:text('teacher_id').notNull().references(()=>users.id),title:text('title').notNull(),subject:text('subject').notNull(),curriculum:text('curriculum').notNull(),
 safety:text('safety').notNull(),duration:integer('duration').notNull(),benchCount:integer('bench_count').notNull(),apparatusIds:text('apparatus_ids').notNull(),questions:text('questions').notNull(),rubric:text('rubric').notNull(),
 status:text('status').notNull().default('active'),startedAt:integer('started_at').notNull(),deadline:integer('deadline').notNull(),endedAt:integer('ended_at'),
},t=>[index('labs_teacher').on(t.teacherId)]);
export const labEntries=sqliteTable('lab_entries',{
 id:text('id').primaryKey(),labId:text('lab_id').notNull().references(()=>labs.id),studentId:text('student_id').notNull().references(()=>users.id),bench:integer('bench'),ready:integer('ready').notNull().default(0),
 answers:text('answers').notNull().default('{}'),equipment:text('equipment').notNull().default('{}'),selfRubric:text('self_rubric').notNull().default('{}'),teacherRubric:text('teacher_rubric').notNull().default('{}'),
 notes:text('notes').notNull().default(''),status:text('status').notNull().default('active'),score:integer('score'),maxScore:integer('max_score'),perQuestion:text('per_question').notNull().default('{}'),
 feedback:text('feedback').notNull().default(''),lastSeen:integer('last_seen').notNull(),submittedAt:integer('submitted_at'),version:integer('version').notNull().default(0),
},t=>[uniqueIndex('one_lab_entry').on(t.labId,t.studentId),index('lab_entries_lab_status').on(t.labId,t.status)]);
export const admissions=sqliteTable('admissions',{
 contactMethod:text('contact_method').notNull().default('phone'),
 studentId:text('student_id').primaryKey().references(()=>users.id),teacherId:text('teacher_id').notNull().references(()=>users.id),phone:text('phone').notNull(),level:text('level').notNull(),goals:text('goals').notNull(),
 status:text('status').notNull().default('pending'),note:text('note').notNull().default(''),requestedAt:integer('requested_at').notNull(),reviewedAt:integer('reviewed_at'),
},t=>[index('admissions_teacher_status').on(t.teacherId,t.status)]);
export const learningPresence=sqliteTable('learning_presence',{
 studentId:text('student_id').primaryKey().references(()=>users.id),lastSeen:integer('last_seen').notNull(),page:text('page').notNull(),handRaised:integer('hand_raised').notNull().default(0),handNote:text('hand_note').notNull().default(''),raisedAt:integer('raised_at'),
});
export const learnerQuestions=sqliteTable('learner_questions',{
 id:text('id').primaryKey(),studentId:text('student_id').notNull().references(()=>users.id),teacherId:text('teacher_id').notNull().references(()=>users.id),lessonId:text('lesson_id').references(()=>lessons.id),question:text('question').notNull(),answer:text('answer').notNull().default(''),source:text('source').notNull().default('pending'),status:text('status').notNull().default('pending'),createdAt:integer('created_at').notNull(),answeredAt:integer('answered_at'),
},t=>[index('questions_daily_teacher').on(t.teacherId,t.createdAt)]);
export const learningDays=sqliteTable('learning_days',{
 id:text('id').primaryKey(),studentId:text('student_id').notNull().references(()=>users.id),lessonId:text('lesson_id').notNull().references(()=>lessons.id),day:text('day').notNull(),at:integer('at').notNull(),
},t=>[uniqueIndex('one_lesson_day').on(t.studentId,t.lessonId,t.day)]);
export const assessmentCycles=sqliteTable('assessment_cycles',{
 id:text('id').primaryKey(),studentId:text('student_id').notNull().references(()=>users.id),teacherId:text('teacher_id').notNull().references(()=>users.id),cycle:integer('cycle').notNull(),examId:text('exam_id').references(()=>exams.id),status:text('status').notNull().default('pending'),createdAt:integer('created_at').notNull(),
},t=>[uniqueIndex('one_assessment_cycle').on(t.studentId,t.cycle)]);
export const dailyReports=sqliteTable('daily_reports',{
 id:text('id').primaryKey(),teacherId:text('teacher_id').notNull().references(()=>users.id),day:text('day').notNull(),data:text('data').notNull(),createdAt:integer('created_at').notNull(),
},t=>[uniqueIndex('one_teacher_daily_report').on(t.teacherId,t.day)]);
export const subscriptionSettings=sqliteTable('subscription_settings',{
 id:text('id').primaryKey(),price:integer('price').notNull().default(0),days:integer('days').notNull().default(30),updatedAt:integer('updated_at').notNull(),
});
export const subscriptions=sqliteTable('subscriptions',{
 id:text('id').primaryKey(),studentId:text('student_id').notNull().references(()=>users.id),phone:text('phone').notNull(),receipt:text('receipt').notNull(),amount:integer('amount').notNull(),days:integer('days').notNull(),status:text('status').notNull().default('pending'),verifiedAt:integer('verified_at'),expiresAt:integer('expires_at'),note:text('note').notNull().default(''),createdAt:integer('created_at').notNull(),
},t=>[uniqueIndex('subscription_receipt').on(t.receipt),index('subscription_active_learner').on(t.studentId,t.status,t.expiresAt)]);
export const videoCredits=sqliteTable('video_credits',{
 studentId:text('student_id').primaryKey().references(()=>users.id),allowance:integer('allowance').notNull().default(1200),used:integer('used').notNull().default(0),leaseId:text('lease_id'),leaseExpires:integer('lease_expires'),grantedAt:integer('granted_at').notNull(),
});
export const learningVideos=sqliteTable('learning_videos',{
 id:text('id').primaryKey(),teacherId:text('teacher_id').notNull().references(()=>users.id),title:text('title').notNull(),url:text('url').notNull(),experiment:text('experiment').notNull().default('general'),explanation:text('explanation').notNull().default(''),createdAt:integer('created_at').notNull(),
});
export const notices=sqliteTable('notices',{
 id:text('id').primaryKey(),studentId:text('student_id').notNull().references(()=>users.id),kind:text('kind').notNull(),ref:text('ref').notNull(),message:text('message').notNull(),createdAt:integer('created_at').notNull(),readAt:integer('read_at'),
},t=>[uniqueIndex('one_notice_ref').on(t.studentId,t.kind,t.ref)]);
export const teacherAccounts=sqliteTable('teacher_accounts',{
 id:text('id').primaryKey(),email:text('email').notNull(),fullName:text('full_name').notNull(),phone:text('phone').notNull().default(''),subject:text('subject').notNull().default(''),
 status:text('status').notNull().default('pending'),userId:text('user_id').references(()=>users.id),createdBy:text('created_by').notNull().references(()=>users.id),createdAt:integer('created_at').notNull(),activatedAt:integer('activated_at'),
},t=>[uniqueIndex('teacher_account_email').on(t.email)]);
export const learnerAccess=sqliteTable('learner_access',{
 studentId:text('student_id').primaryKey().references(()=>users.id),loginId:text('login_id').notNull(),expiresAt:integer('expires_at').notNull(),issuedAt:integer('issued_at').notNull(),
},t=>[uniqueIndex('learner_login_id').on(t.loginId)]);
export const classroomRooms=sqliteTable('classroom_rooms',{
 id:text('id').primaryKey(),teacherId:text('teacher_id').notNull().references(()=>users.id),name:text('name').notNull(),description:text('description').notNull().default(''),createdAt:integer('created_at').notNull(),
});
export const classroomCalls=sqliteTable('classroom_calls',{
 sessionId:text('session_id').references(()=>classSessions.id),
 id:text('id').primaryKey(),roomId:text('room_id').notNull().references(()=>classroomRooms.id),studentId:text('student_id').notNull().references(()=>users.id),teacherId:text('teacher_id').notNull().references(()=>users.id),
 topic:text('topic').notNull(),status:text('status').notNull().default('waiting'),createdAt:integer('created_at').notNull(),acceptedAt:integer('accepted_at'),endedAt:integer('ended_at'),lastSeen:integer('last_seen').notNull(),
},t=>[index('calls_room_status').on(t.roomId,t.status)]);
export const callSignals=sqliteTable('call_signals',{
 id:integer('id').primaryKey({autoIncrement:true}),callId:text('call_id').notNull().references(()=>classroomCalls.id),senderId:text('sender_id').notNull().references(()=>users.id),type:text('type').notNull(),payload:text('payload').notNull(),createdAt:integer('created_at').notNull(),
},t=>[index('signals_call_id').on(t.callId,t.id)]);
export const cctvCameras=sqliteTable('cctv_cameras',{
 id:text('id').primaryKey(),roomId:text('room_id').notNull().references(()=>classroomRooms.id),name:text('name').notNull(),url:text('url').notNull(),format:text('format').notNull(),enabled:integer('enabled').notNull().default(1),createdAt:integer('created_at').notNull(),
});
export const virtualRuns=sqliteTable('virtual_runs',{
 id:text('id').primaryKey(),studentId:text('student_id').notNull().references(()=>users.id),experiment:text('experiment').notNull(),inputs:text('inputs').notNull(),results:text('results').notNull(),notes:text('notes').notNull(),createdAt:integer('created_at').notNull(),
});
export const paymentAccessGrants=sqliteTable('payment_access_grants',{
 paymentId:text('payment_id').primaryKey().references(()=>payments.id),studentId:text('student_id').notNull().references(()=>users.id),expiresAt:integer('expires_at').notNull(),grantedAt:integer('granted_at').notNull(),
});
export const classSessions=sqliteTable('class_sessions',{
 startMode:text('start_mode').notNull().default('automatic'),startedAt:integer('started_at'),startedBy:text('started_by').references(()=>users.id),teacherPresentId:text('teacher_present_id').references(()=>users.id),teacherJoinedAt:integer('teacher_joined_at'),teacherLastSeen:integer('teacher_last_seen'),
 mediaMode:text('media_mode').notNull().default('peer'),learnerLimit:integer('learner_limit').notNull().default(2000),
 durationMinutes:integer('duration_minutes').notNull().default(40),endsAt:integer('ends_at'),muteAll:integer('mute_all').notNull().default(0),
 id:text('id').primaryKey(),roomId:text('room_id').notNull().references(()=>classroomRooms.id),title:text('title').notNull(),status:text('status').notNull().default('preparing'),opensAt:integer('opens_at').notNull(),startsAt:integer('starts_at').notNull(),endedAt:integer('ended_at'),
},t=>[index('class_sessions_room').on(t.roomId,t.opensAt),index('class_sessions_status_open').on(t.status,t.opensAt),index('class_sessions_due').on(t.status,t.endsAt),index('class_sessions_preparation_due').on(t.status,t.startsAt)]);
export const classAttendance=sqliteTable('class_attendance',{
 micPolicy:text('mic_policy').notNull().default('inherit'),
 id:text('id').primaryKey(),sessionId:text('session_id').notNull().references(()=>classSessions.id),studentId:text('student_id').notNull().references(()=>users.id),joinedAt:integer('joined_at').notNull(),lastSeen:integer('last_seen').notNull(),ready:integer('ready').notNull().default(0),leftAt:integer('left_at'),cameraFrame:text('camera_frame'),cameraAt:integer('camera_at'),
},t=>[uniqueIndex('class_attendance_learner').on(t.sessionId,t.studentId),index('class_attendance_presence').on(t.sessionId,t.lastSeen),index('class_attendance_student_open').on(t.studentId,t.leftAt,t.lastSeen),index('class_camera_expiry').on(t.cameraAt)]);
export const paymentIntents=sqliteTable('payment_intents',{
 initiatedBy:text('initiated_by').references(()=>users.id),
 callbackReceivedAt:integer('callback_received_at'),recordingError:text('recording_error').notNull().default(''),
 purpose:text('purpose').notNull().default('tuition'),
 id:text('id').primaryKey(),studentId:text('student_id').notNull().references(()=>users.id),phone:text('phone').notNull(),amount:integer('amount').notNull(),days:integer('days').notNull(),status:text('status').notNull().default('starting'),checkoutId:text('checkout_id'),merchantId:text('merchant_id'),message:text('message').notNull().default(''),createdAt:integer('created_at').notNull(),checkedAt:integer('checked_at'),confirmedAt:integer('confirmed_at'),
},t=>[uniqueIndex('payment_intent_checkout').on(t.checkoutId),index('payment_intent_student').on(t.studentId,t.createdAt)]);
export const cctvMonitors=sqliteTable('cctv_monitors',{
 id:text('id').primaryKey(),roomId:text('room_id').notNull().references(()=>classroomRooms.id),teacherId:text('teacher_id').notNull().references(()=>users.id),createdBy:text('created_by').notNull().references(()=>users.id),createdAt:integer('created_at').notNull(),
},t=>[uniqueIndex('cctv_monitor_room_teacher').on(t.roomId,t.teacherId)]);
export const teachingOutlines=sqliteTable('teaching_outlines',{
 id:text('id').primaryKey(),teacherId:text('teacher_id').notNull().references(()=>users.id),classLevel:text('class_level').notNull(),subject:text('subject').notNull(),title:text('title').notNull(),notes:text('notes').notNull().default(''),createdAt:integer('created_at').notNull(),
},t=>[uniqueIndex('teaching_outline_topic').on(t.teacherId,t.classLevel,t.subject,t.title)]);
export const lessonAccessEvents=sqliteTable('lesson_access_events',{
 id:text('id').primaryKey(),studentId:text('student_id').notNull().references(()=>users.id),teacherId:text('teacher_id').references(()=>users.id),resource:text('resource').notNull(),reason:text('reason').notNull(),bucket:integer('bucket').notNull(),attemptCount:integer('attempt_count').notNull().default(1),firstAt:integer('first_at').notNull(),lastAt:integer('last_at').notNull(),
},t=>[uniqueIndex('access_event_window').on(t.studentId,t.resource,t.reason,t.bucket),index('access_event_teacher').on(t.teacherId,t.lastAt)]);

export const assignments=sqliteTable('assignments',{
 gradingBands:text('grading_bands'),
 id:text('id').primaryKey(),teacherId:text('teacher_id').notNull().references(()=>users.id),title:text('title').notNull(),instructions:text('instructions').notNull().default(''),classLevel:text('class_level').notNull(),subject:text('subject').notNull(),topic:text('topic').notNull(),status:text('status').notNull().default('draft'),dueAt:integer('due_at'),createdAt:integer('created_at').notNull(),publishedAt:integer('published_at'),
});
export const assignmentQuestions=sqliteTable('assignment_questions',{
 id:text('id').primaryKey(),assignmentId:text('assignment_id').notNull().references(()=>assignments.id),position:integer('position').notNull(),text:text('text').notNull(),choices:text('choices').notNull(),correct:integer('correct').notNull(),explanation:text('explanation').notNull().default(''),
},t=>[uniqueIndex('assignment_question_position').on(t.assignmentId,t.position)]);
export const assignmentEntries=sqliteTable('assignment_entries',{
 uploadedWork:text('uploaded_work'),feedback:text('feedback').notNull().default(''),
 id:text('id').primaryKey(),assignmentId:text('assignment_id').notNull().references(()=>assignments.id),studentId:text('student_id').notNull().references(()=>users.id),status:text('status').notNull().default('assigned'),answers:text('answers').notNull().default('{}'),score:integer('score'),total:integer('total').notNull(),assignedAt:integer('assigned_at').notNull(),submittedAt:integer('submitted_at'),
},t=>[uniqueIndex('assignment_entry_student').on(t.assignmentId,t.studentId)]);

export const classChats=sqliteTable('class_chats',{
 id:text('id').primaryKey(),teacherId:text('teacher_id').notNull().references(()=>users.id),classLevel:text('class_level').notNull(),subject:text('subject').notNull(),topic:text('topic').notNull(),title:text('title').notNull(),status:text('status').notNull().default('open'),lessonId:text('lesson_id').references(()=>lessons.id),createdAt:integer('created_at').notNull(),updatedAt:integer('updated_at').notNull(),
},t=>[uniqueIndex('class_chat_topic').on(t.teacherId,t.classLevel,t.subject,t.topic)]);
export const classChatMessages=sqliteTable('class_chat_messages',{
 id:text('id').primaryKey(),roomId:text('room_id').notNull().references(()=>classChats.id),senderId:text('sender_id').notNull().references(()=>users.id),body:text('body').notNull(),createdAt:integer('created_at').notNull(),removedAt:integer('removed_at'),removedBy:text('removed_by').references(()=>users.id),
},t=>[index('chat_messages_room_time').on(t.roomId,t.createdAt),index('chat_messages_sender_time').on(t.senderId,t.createdAt)]);

export const conferencePasses=sqliteTable('conference_passes',{
 codeHash:text('code_hash').primaryKey(),redeemBy:integer('redeem_by').notNull(),studentId:text('student_id').references(()=>users.id),claimedAt:integer('claimed_at'),expiresAt:integer('expires_at'),
},t=>[uniqueIndex('conference_student_once').on(t.studentId)]);

export const teacherApplications=sqliteTable('teacher_applications',{
 contactMethod:text('contact_method').notNull().default('phone'),
 id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>users.id),fullName:text('full_name').notNull(),phone:text('phone').notNull(),subject:text('subject').notNull(),experience:text('experience').notNull(),status:text('status').notNull().default('pending'),note:text('note').notNull().default(''),createdAt:integer('created_at').notNull(),reviewedAt:integer('reviewed_at'),reviewedBy:text('reviewed_by').references(()=>users.id),
},t=>[uniqueIndex('teacher_application_user').on(t.userId)]);

export const teachingClasses=sqliteTable('teaching_classes',{
 id:text('id').primaryKey(),teacherId:text('teacher_id').notNull().references(()=>users.id),name:text('name').notNull(),classLevel:text('class_level').notNull(),subject:text('subject').notNull(),topic:text('topic').notNull(),roomId:text('room_id').notNull().references(()=>classroomRooms.id),createdAt:integer('created_at').notNull(),
});
export const timetableSlots=sqliteTable('timetable_slots',{
 id:text('id').primaryKey(),classId:text('class_id').notNull().references(()=>teachingClasses.id),weekday:integer('weekday').notNull(),startMinute:integer('start_minute').notNull(),endMinute:integer('end_minute').notNull(),location:text('location').notNull(),status:text('status').notNull().default('scheduled'),createdAt:integer('created_at').notNull(),
},t=>[index('timetable_day').on(t.weekday,t.startMinute)]);
export const classRolls=sqliteTable('class_rolls',{
 id:text('id').primaryKey(),classId:text('class_id').notNull().references(()=>teachingClasses.id),studentId:text('student_id').notNull().references(()=>users.id),day:text('day').notNull(),status:text('status').notNull(),markedBy:text('marked_by').notNull().references(()=>users.id),markedAt:integer('marked_at').notNull(),
},t=>[uniqueIndex('class_roll_student_day').on(t.classId,t.studentId,t.day)]);
export const lessonBoards=sqliteTable('lesson_boards',{
 classId:text('class_id').primaryKey().references(()=>teachingClasses.id),title:text('title').notNull(),body:text('body').notNull(),isLive:integer('is_live').notNull().default(0),updatedBy:text('updated_by').notNull().references(()=>users.id),updatedAt:integer('updated_at').notNull(),
});
export const boardDisplays=sqliteTable('board_displays',{
 id:text('id').primaryKey(),classId:text('class_id').notNull().references(()=>teachingClasses.id),userId:text('user_id').notNull().references(()=>users.id),lastSeen:integer('last_seen').notNull(),
},t=>[index('board_display_class').on(t.classId,t.lastSeen)]);

export const registrationFeeSettings=sqliteTable('registration_fee_settings',{id:text('id').primaryKey(),amount:integer('amount').notNull(),updatedAt:integer('updated_at').notNull()});
export const registrationPayments=sqliteTable('registration_payments',{
 id:text('id').primaryKey(),studentId:text('student_id').notNull().references(()=>users.id),phone:text('phone').notNull(),receipt:text('receipt').notNull(),amount:integer('amount').notNull(),status:text('status').notNull().default('pending'),note:text('note').notNull().default(''),createdAt:integer('created_at').notNull(),verifiedAt:integer('verified_at'),reviewedBy:text('reviewed_by').references(()=>users.id),
},t=>[uniqueIndex('registration_receipt').on(t.receipt),uniqueIndex('registration_one_active_student').on(t.studentId).where(sql`status IN ('pending','verified')`)]);
export const paymentReceiptReservations=sqliteTable('payment_receipt_reservations',{receipt:text('receipt').primaryKey(),kind:text('kind').notNull(),paymentId:text('payment_id').notNull(),createdAt:integer('created_at').notNull()});

export const classEnrollments=sqliteTable('class_enrollments',{
 id:text('id').primaryKey(),classId:text('class_id').notNull().references(()=>teachingClasses.id),studentId:text('student_id').notNull().references(()=>users.id),status:text('status').notNull().default('active'),enrolledAt:integer('enrolled_at').notNull(),
},t=>[uniqueIndex('enrollment_class_student').on(t.classId,t.studentId),index('class_active_enrollment').on(t.classId,t.status,t.studentId),index('enrollment_student_class').on(t.studentId,t.classId)]);
export const cascadedClips=sqliteTable('cascaded_clips',{
 id:text('id').primaryKey(),sessionId:text('session_id').notNull().references(()=>classSessions.id),clipId:text('clip_id').notNull().references(()=>learningVideos.id),status:text('status').notNull().default('cascaded'),durationSeconds:integer('duration_seconds').notNull(),displayOrder:integer('display_order').notNull(),sharedAt:integer('shared_at').notNull(),sharedBy:text('shared_by').notNull().references(()=>users.id),
},t=>[uniqueIndex('cascade_session_clip').on(t.sessionId,t.clipId),index('cascade_lesson_order').on(t.sessionId,t.status,t.displayOrder,t.sharedAt)]);
export const clipPermits=sqliteTable('clip_permits',{
 id:text('id').primaryKey(),cascadeId:text('cascade_id').notNull().references(()=>cascadedClips.id),userId:text('user_id').notNull().references(()=>users.id),issuedAt:integer('issued_at').notNull(),expiresAt:integer('expires_at').notNull(),reservedSeconds:integer('reserved_seconds').notNull(),
},t=>[index('clip_permit_user').on(t.userId,t.expiresAt)]);
export const clipTelemetry=sqliteTable('clip_telemetry',{
 id:text('id').primaryKey(),permitId:text('permit_id').notNull().references(()=>clipPermits.id),cascadeId:text('cascade_id').notNull().references(()=>cascadedClips.id),studentId:text('student_id').notNull().references(()=>users.id),kind:text('kind').notNull(),position:integer('position').notNull(),watchedMs:integer('watched_ms').notNull().default(0),occurredAt:integer('occurred_at').notNull(),receivedAt:integer('received_at').notNull(),
},t=>[index('clip_events_lesson_student').on(t.cascadeId,t.studentId,t.occurredAt)]);
export const clipAlerts=sqliteTable('clip_alerts',{
 id:text('id').primaryKey(),cascadeId:text('cascade_id').notNull().references(()=>cascadedClips.id),bucket:integer('bucket').notNull(),affected:integer('affected').notNull(),viewers:integer('viewers').notNull(),createdAt:integer('created_at').notNull(),
},t=>[uniqueIndex('clip_alert_bucket').on(t.cascadeId,t.bucket)]);

export const conferencePeers=sqliteTable('conference_peers',{
 id:text('id').primaryKey(),sessionId:text('session_id').notNull().references(()=>classSessions.id),userId:text('user_id').notNull().references(()=>users.id),joinedAt:integer('joined_at').notNull(),lastSeen:integer('last_seen').notNull(),
},t=>[uniqueIndex('conference_session_user').on(t.sessionId,t.userId),index('conference_recent_peers').on(t.sessionId,t.lastSeen)]);
export const conferenceSignals=sqliteTable('conference_signals',{
 id:integer('id').primaryKey({autoIncrement:true}),eventId:text('event_id').notNull(),sessionId:text('session_id').notNull().references(()=>classSessions.id),fromPeer:text('from_peer').notNull(),toPeer:text('to_peer').notNull(),kind:text('kind').notNull(),payload:text('payload').notNull(),createdAt:integer('created_at').notNull(),
},t=>[uniqueIndex('conference_signal_event').on(t.eventId),index('conference_recipient_cursor').on(t.toPeer,t.id)]);

export const learnerSubjects=sqliteTable('learner_subjects',{
 id:text('id').primaryKey(),studentId:text('student_id').notNull().references(()=>users.id),classLevel:text('class_level').notNull(),subject:text('subject').notNull(),status:text('status').notNull().default('attend'),note:text('note').notNull().default(''),updatedBy:text('updated_by').notNull().references(()=>users.id),updatedAt:integer('updated_at').notNull(),
},t=>[uniqueIndex('learner_subject_level').on(t.studentId,t.classLevel,t.subject)]);

export const hlsPackages=sqliteTable('hls_packages',{
 id:text('id').primaryKey(),videoId:text('video_id').notNull().references(()=>learningVideos.id),createdBy:text('created_by').notNull().references(()=>users.id),entry:text('entry').notNull().default('master.m3u8'),status:text('status').notNull().default('draft'),createdAt:integer('created_at').notNull(),
},t=>[index('hls_video_status').on(t.videoId,t.status)]);
export const hlsAssets=sqliteTable('hls_assets',{
 id:text('id').primaryKey(),packageId:text('package_id').notNull().references(()=>hlsPackages.id),path:text('path').notNull(),contentType:text('content_type').notNull(),size:integer('size').notNull(),
},t=>[uniqueIndex('hls_package_path').on(t.packageId,t.path)]);

export const sfuRooms=sqliteTable('sfu_rooms',{
 sessionId:text('session_id').primaryKey().references(()=>classSessions.id),roomName:text('room_name').notNull(),createdAt:integer('created_at').notNull(),lastReconciled:integer('last_reconciled').notNull().default(0),leaseUntil:integer('lease_until').notNull().default(0),status:text('status').notNull().default('active'),
},t=>[index('sfu_active_reconcile').on(t.status,t.lastReconciled),uniqueIndex('sfu_room_name').on(t.roomName)]);

// Negotiated pay periods. Accepted terms and issued statements remain auditable.
export const teacherPayAgreements=sqliteTable('teacher_pay_agreements',{
 id:text('id').primaryKey(),teacherId:text('teacher_id').notNull().references(()=>users.id),rateCents:integer('rate_cents').notNull(),
 startsAt:integer('starts_at').notNull(),endsAt:integer('ends_at').notNull(),terms:text('terms').notNull(),
 companyContract:text('company_contract').notNull().default(''),acceptedName:text('accepted_name'),status:text('status').notNull().default('proposed'),replacesId:text('replaces_id'),proposedBy:text('proposed_by').notNull().references(()=>users.id),
 createdAt:integer('created_at').notNull(),acceptedAt:integer('accepted_at'),respondedAt:integer('responded_at'),
},t=>[index('teacher_pay_periods').on(t.teacherId,t.status,t.startsAt)]);
export const teacherPayStatements=sqliteTable('teacher_pay_statements',{
 id:text('id').primaryKey(),agreementId:text('agreement_id').notNull().references(()=>teacherPayAgreements.id),teacherId:text('teacher_id').notNull().references(()=>users.id),
 learnerCount:integer('learner_count').notNull(),rateCents:integer('rate_cents').notNull(),amountCents:integer('amount_cents').notNull(),
 createdAt:integer('created_at').notNull(),createdBy:text('created_by').notNull().references(()=>users.id),paidAt:integer('paid_at'),
 paymentReference:text('payment_reference'),paidBy:text('paid_by').references(()=>users.id),
},t=>[uniqueIndex('teacher_pay_once').on(t.agreementId),uniqueIndex('teacher_pay_reference').on(t.paymentReference),index('teacher_pay_teacher').on(t.teacherId,t.createdAt)]);
export const teacherPayLearners=sqliteTable('teacher_pay_learners',{
 id:text('id').primaryKey(),statementId:text('statement_id').notNull().references(()=>teacherPayStatements.id),studentId:text('student_id').notNull().references(()=>users.id),
},t=>[uniqueIndex('teacher_pay_distinct_learner').on(t.statementId,t.studentId)]);
export const teacherPayAudit=sqliteTable('teacher_pay_audit',{
 id:text('id').primaryKey(),teacherId:text('teacher_id').notNull().references(()=>users.id),actorId:text('actor_id').notNull().references(()=>users.id),
 action:text('action').notNull(),recordId:text('record_id').notNull(),details:text('details').notNull(),at:integer('at').notNull(),
},t=>[index('teacher_pay_audit_teacher').on(t.teacherId,t.at)]);

export const lessonResources=sqliteTable('lesson_resources',{
 id:text('id').primaryKey(),classId:text('class_id').notNull().references(()=>teachingClasses.id),sessionId:text('session_id').notNull().references(()=>classSessions.id),
 teacherId:text('teacher_id').notNull().references(()=>users.id),resourceKey:text('resource_key').notNull(),instructions:text('instructions').notNull(),sharedAt:integer('shared_at').notNull(),withdrawnAt:integer('withdrawn_at'),
},t=>[index('lesson_resource_session').on(t.sessionId,t.withdrawnAt,t.sharedAt)]);

export const subjectQuestionSets=sqliteTable('subject_question_sets',{
 id:text('id').primaryKey(),teacherId:text('teacher_id').references(()=>users.id),lessonId:text('lesson_id').references(()=>lessons.id),sourceKey:text('source_key').notNull(),sourceUrl:text('source_url'),classLevel:text('class_level').notNull(),subject:text('subject').notNull(),title:text('title').notNull(),questions:text('questions').notNull(),status:text('status').notNull().default('draft'),createdAt:integer('created_at').notNull(),reviewedBy:text('reviewed_by').references(()=>users.id),reviewedAt:integer('reviewed_at'),
},t=>[uniqueIndex('subject_questions_source').on(t.sourceKey,t.classLevel),index('subject_questions_course').on(t.teacherId,t.classLevel,t.subject,t.status)]);
export const subjectTutorials=sqliteTable('subject_tutorials',{
 id:text('id').primaryKey(),teacherId:text('teacher_id').notNull().references(()=>users.id),videoId:text('video_id').notNull().references(()=>learningVideos.id),topic:text('topic').notNull().default(''),classLevel:text('class_level').notNull(),subject:text('subject').notNull(),title:text('title').notNull(),description:text('description').notNull(),status:text('status').notNull().default('published'),createdAt:integer('created_at').notNull(),
},t=>[uniqueIndex('subject_tutorial_course').on(t.videoId,t.classLevel,t.subject),index('subject_tutorial_listing').on(t.teacherId,t.classLevel,t.subject,t.status)]);
export const subjectPurchases=sqliteTable('subject_purchases',{
 id:text('id').primaryKey(),studentId:text('student_id').notNull().references(()=>users.id),teacherId:text('teacher_id').notNull().references(()=>users.id),classLevel:text('class_level').notNull(),subject:text('subject').notNull(),product:text('product').notNull(),topic:text('topic').notNull().default(''),amount:integer('amount').notNull(),receipt:text('receipt').notNull(),phone:text('phone').notNull(),status:text('status').notNull().default('pending'),createdAt:integer('created_at').notNull(),reviewedAt:integer('reviewed_at'),reviewedBy:text('reviewed_by').references(()=>users.id),note:text('note').notNull().default(''),expiresAt:integer('expires_at'),
},t=>[uniqueIndex('subject_purchase_receipt').on(t.receipt),uniqueIndex('subject_purchase_pending').on(t.studentId,t.teacherId,t.classLevel,t.subject,t.product,t.topic).where(sql`status='pending'`),index('subject_purchase_access').on(t.studentId,t.teacherId,t.classLevel,t.subject,t.product,t.status,t.expiresAt)]);
export const subjectAttempts=sqliteTable('subject_attempts',{
 id:text('id').primaryKey(),studentId:text('student_id').notNull().references(()=>users.id),setId:text('set_id').notNull().references(()=>subjectQuestionSets.id),answers:text('answers').notNull(),score:integer('score').notNull(),total:integer('total').notNull(),submittedAt:integer('submitted_at').notNull(),
},t=>[uniqueIndex('subject_attempt_once').on(t.studentId,t.setId)]);

export const learnerOrientation=sqliteTable('learner_orientation',{studentId:text('student_id').primaryKey().references(()=>users.id),startedAt:integer('started_at').notNull(),expiresAt:integer('expires_at').notNull()});

export const userAccountAudit=sqliteTable('user_account_audit',{id:text('id').primaryKey(),actorId:text('actor_id').notNull().references(()=>users.id),targetId:text('target_id').notNull().references(()=>users.id),action:text('action').notNull(),before:text('before').notNull(),after:text('after').notNull(),at:integer('at').notNull()},t=>[index('user_account_audit_target').on(t.targetId,t.at)]);

export const mpesaB2BRequests=sqliteTable('mpesa_b2b_requests',{
 id:text('id').primaryKey(),createdBy:text('created_by').notNull().references(()=>users.id),requestHash:text('request_hash').notNull(),callbackHash:text('callback_hash').notNull(),amount:integer('amount').notNull(),receiverShortcode:text('receiver_shortcode').notNull(),accountReference:text('account_reference').notNull(),status:text('status').notNull(),conversationId:text('conversation_id'),originatorId:text('originator_id'),resultCode:text('result_code'),createdAt:integer('created_at').notNull(),callbackReceivedAt:integer('callback_received_at'),
},t=>[index('b2b_created_by').on(t.createdBy,t.createdAt)]);

export const studentPaymentAudit=sqliteTable('student_payment_audit',{
 id:text('id').primaryKey(),actorId:text('actor_id').notNull().references(()=>users.id),studentId:text('student_id').notNull().references(()=>users.id),paymentId:text('payment_id').notNull(),purpose:text('purpose').notNull(),amount:integer('amount').notNull(),requestFingerprint:text('request_fingerprint').notNull(),createdAt:integer('created_at').notNull(),
},t=>[uniqueIndex('student_payment_audit_payment').on(t.paymentId)]);

export const paymentReviewAudit=sqliteTable('payment_review_audit',{
 id:text('id').primaryKey(),paymentId:text('payment_id').notNull(),purpose:text('purpose').notNull(),studentId:text('student_id').notNull().references(()=>users.id),actorId:text('actor_id').notNull().references(()=>users.id),status:text('status').notNull(),amount:integer('amount').notNull(),receipt:text('receipt').notNull(),note:text('note').notNull(),reviewedAt:integer('reviewed_at').notNull(),
},t=>[uniqueIndex('payment_review_once').on(t.purpose,t.paymentId)]);

export const clipPresentations=sqliteTable('clip_presentations',{
 sessionId:text('session_id').primaryKey().references(()=>classSessions.id),cascadeId:text('cascade_id').notNull().references(()=>cascadedClips.id),position:integer('position').notNull(),playing:integer('playing').notNull(),following:integer('following').notNull(),updatedAt:integer('updated_at').notNull(),updatedBy:text('updated_by').notNull().references(()=>users.id),
});

export const timedAccessWindows=sqliteTable('timed_access_windows',{
 id:text('id').primaryKey(),createdBy:text('created_by').notNull().references(()=>users.id),createdAt:integer('created_at').notNull(),expiresAt:integer('expires_at').notNull(),hours:integer('hours').notNull(),note:text('note').notNull(),revokedAt:integer('revoked_at'),revokedBy:text('revoked_by').references(()=>users.id),
});
export const timedAccessMembers=sqliteTable('timed_access_members',{
 windowId:text('window_id').notNull().references(()=>timedAccessWindows.id),studentId:text('student_id').notNull().references(()=>users.id),
},t=>[primaryKey({columns:[t.windowId,t.studentId]}),index('timed_access_student').on(t.studentId,t.windowId)]);

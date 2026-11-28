# Class hub integration

The uploaded React prototype has been adapted into the existing JEZTECH Learning application. Existing ChatGPT identity, administrator approvals, teacher ownership, paid student access, M-Pesa reconciliation and learning data remain authoritative.

## Modules

- `app/hub`: durable teaching classes, recurring weekly timetable, daily attendance and shared lesson boards.
- `app/api/hub`: authenticated read/write API with server-side authorization and schedule conflict checks.
- `app/display`: signed-in classroom display. Shares text and notes with five-second polling; it does not implement desktop mirroring. Existing WebRTC camera/microphone calls remain in Connected classroom.
- `app/registration-fee`: one-time registration fee, separate ledger and receipts. Default KSh 100 comes from the supplied prototype and can be changed by the administrator.
- `app/payments`: registration and tuition payment intents carry separate server-priced purposes. Only verified tuition payments create subscriptions and extend learner access. Registration confirmation never awards video credit or creates paid access.

The prototype's mock learners, random receipts, artificial screen counts and hard-coded active school licence were not imported into production. No annual school licence was created or charged. Tuition amounts and six-day access policies remain in their existing settings. Receipt reservations prevent a manually submitted receipt from being used for multiple fee categories. Live phone prompts depend on the existing secure Safaricom configuration and require real end-to-end provider verification.

Staff create classes in Class control hub. Existing admitted students are matched by assigned teacher and class level. Timetables use Africa/Nairobi weekly wall-clock times; these are saved schedules, not scheduled automation jobs. Daily attendance is explicitly marked by a teacher and is separate from recent online activity. Assignment averages include submitted assignments in that class and subject; no average is fabricated for learners without results.

Migrations 0018–0020 add these modules without importing sample data. Automated checks cover class isolation, timetable collisions, attendance, board visibility during assessments, fee separation, receipt reuse and idempotent provider confirmation.

## Timed lessons and student home

Connected classroom now supports preparation (1–30 minutes, default 10) and teaching duration (1–180 minutes, default 40). New lessons wait for the teacher after preparation. The teacher can join during preparation, then use Start lesson, or use Join class & start lesson once preparation finishes. The full teaching duration begins at the teacher’s actual start time. Repeated starts and rejoining never extend the lesson. The server records the starting teacher, actual start time and current teacher presence, and advances deadline state when classroom or display APIs are accessed. Previously opened automatic lessons retain their existing timers. Browser countdowns use server clock offsets. Calls created in timed lessons are linked to their session; expired or manually ended sessions close those calls, clear camera check-ins, and remove attendance presence. Browser media also closes at the stored deadline. No scheduled background job is required to enforce the deadline on subsequent API operations.

Teacher controls include mute-all, allow-all-to-unmute and per-student microphone permission. Changes are received through classroom and call polling. Both the learner's outgoing audio track and the teacher's incoming player honor the mute state. Allowing a microphone never automatically captures audio or enables a learner-muted microphone. Existing calls use peer-to-peer WebRTC; full multi-party audio mixing and TURN relay provisioning are not part of this change.

The student overview has a dedicated lesson room, written question form, raised hand, saved explanations, assignment shortcut and assessment results navigation. Active assessment learning assistance remains disabled. Shared lesson displays clear at lesson end; ordinary written follow-up questions remain available to admitted students with active tuition access.

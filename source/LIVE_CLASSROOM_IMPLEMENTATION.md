# JEZTECH classroom implementation and acceptance status

## Published application architecture

The Site uses Cloudflare Workers, D1 and R2. Existing admissions, payment verification, teacher assignments, teaching classes and timed lessons remain authoritative. Written lessons remain in `lessons`; live sessions remain in `class_sessions`. No fictional learners or payments are seeded.

### Student class and subject attendance

Students see their admitted class, assigned teacher and offered subjects on their dashboard and approved learner activation page. Exempted subjects are struck through and explicitly labelled Exempted. They have no lesson-entry link. Teachers and administrators use Subjects & exemptions to exempt or restore a subject with an optional note. Learners cannot grant themselves exemptions.

`learner_subjects` records status by student, class level and subject. Exemption blocks all teaching courses for that subject, not just one room, and closes current presence, media and camera-check-in state. Exempt learners are excluded from expected lesson rosters and cannot be marked absent/present for that subject. Restoring subject attendance never overrides a separately removed class enrolment. Subjects not yet set up by the teacher are not presented as active lessons. Previously recorded attendance and grades remain historical records.

### Teacher preparation and live lessons

Teachers create/select their teaching class, set preparation time and lesson duration, join the room and start teaching once preparation ends. Timers are enforced on the server and in active media clients. Existing automatic sessions remain compatible. Students join their authorised lesson; presence uses recent heartbeats, not invented online counts.

`/classroom/[classId]` combines lesson controls, shared notes, live media, clips, questions and online learners. Teachers can choose their published class/subject notes or write notes, then share/withdraw the lesson board. Student snapshots hide unpublished/stopped boards, boards outside a live lesson and boards during active assessments. Teacher corrections and drafts are preserved.

### Live media for a teacher and up to ten audience connections

`/api/conference-media` implements authenticated, durable offer/answer/ICE signaling. Participants derive from verified accounts, paid access, class enrolment and joined lesson attendance. One teacher offers media to the audience. Learner camera streams are visible to the teacher. Teacher-side mix-minus audio forwards the teacher and currently allowed learner microphones to the audience without feeding learners their own audio. The teacher must keep the page open; this is a browser-hosted star conference, not a hosted SFU.

Device access starts only from a participant's Join action and optional camera/microphone choices. Microphones start muted. Teacher allow-to-unmute does not automatically enable a learner's mic. Server-derived mic policy gates teacher playback and audio mixing. Leaving, changed publisher, lesson expiry, subject exemption, removed enrolment or expired tuition closes connections. Clients stop media after at most 75 seconds without renewed server authorization. Signaling is bounded, account-bound and idempotent. Audience capacity is enforced atomically in D1.

The default uses STUN and direct peer connections. For restrictive networks, configure `TURN_URLS` and `TURN_SHARED_SECRET` for an operated Coturn-compatible relay. The Site emits short-lived HMAC credentials, never the shared secret. Relay provisioning, reachability and real multi-device capacity testing are not established by unit tests. No call recording is stored.

### Shared clips and adaptive HLS

Teachers share/withdraw their own uploaded MP4/WebM clips into a live lesson. Durable clip records are deduplicated. Students need a user-bound playback reservation; earned video credit is charged once upfront and atomically with the permit. A repeated request returns the same active reservation. Reservations cannot outlive the lesson or paid-access period. Registration fees remain separate from tuition and never grant this access.

For adaptive playback, run `python scripts/media/encode-hls.py INPUT OUTPUT_DIRECTORY` on a media-processing machine with FFmpeg/ffprobe. It creates completed low (240p), medium (480p) and high (up to 1080p) renditions without upscaling the source height. Upload the complete folder from Add adaptive HLS versions in the classroom. Publication validates owned assets, supported VOD playlists, required files, size bounds and cyclic references. Paths cannot contain external URLs or traversal; encrypted/live/byte-range playlists are not supported. Published packages are immutable; replacements use new packages.

Each HLS playlist and segment uses the same authorised classroom reservation endpoint. The player uses native HLS where supported or the locally bundled HLS.js library; constrained devices cap automatic quality. Original uploaded video remains a selectable fallback. Encoding does not happen inside Workers. Only real, uploaded renditions are offered.

### Bounded offline buffering and reporting

The classroom service worker caches only explicitly requested, permitted media. It does not cache authentication pages, dashboard APIs, ordinary paid videos or unrelated origins. Complete MP4 buffers or one complete lowest-bandwidth VOD rendition may be saved, subject to a 12 MiB requested buffer, 40 MiB cache and conservative 80% device quota check. The UI verifies saved assets and does not report partial downloads as complete. Expiry and account ownership are checked for cached responses; cached MP4 ranges support full, open and suffix byte requests. Active reservations are protected from normal cache eviction. An offline device cannot discover a new withdrawal until reconnecting; the original reservation still expires. This is not DRM or persistent access beyond subscription expiry.

Playback events are queued per account in IndexedDB (500 events, 24-hour retention), sent in batches of at most 50, and deduplicated by the server. Only acknowledged/rejected IDs are removed. Foreground reconnect/timer retries work in an open classroom. On browsers supporting Background Sync, the service worker also retries while the tab is closed; unsupported browsers retain foreground retries. Browser sign-out or account changes never authorize another account's queued events or clear them as that account's data. No credentials are stored in the queue.

Watch time, reached-position distribution and shared pause/buffering alerts are teacher review signals, not proof of attention or misconduct. At least three distinct reporters and a 20% threshold within five minutes are needed for a shared alert. Video reports never grade active exams or assignments. Existing assignment auto-marking and rankings remain server-calculated.

### Monitoring and discoverability

Teacher/admin home pages link directly to their classrooms. Students see authorised classes and subjects. The admin live monitor reports actual teachers, timed sessions, recent learner presence connections and shared clips. Empty states show no sample metrics. SSE reconnects with complete snapshots; polling provides a fallback. Workspace/class-board/camera refresh requests do not overlap on slow connections.

## Remaining external prerequisites

- Live M-Pesa needs authorised consumer key/secret, passkey, valid shortcode/callback configuration and a real end-to-end provider test. The current system supports separate registration/tuition ledgers and verified manual receipt processing; typed receipts and pending prompts never unlock access automatically.
- A reachable TURN relay and its shared secret must be supplied for networks requiring relayed media. No relay or SFU server has been provisioned.
- Full current KICD topic/notes coverage is not certified. The existing reference/source catalogue and reviewed notes remain labelled by provenance and edition. Missing source material must be obtained and reviewed; teacher imports preserve existing work. No generic notes are mislabelled as complete official syllabus notes.
- Automatic AI-provider responses/video generation require an authorised provider integration. Existing original practical models and teacher authoring remain available; copying a preparation prompt is not an automatic AI API.
- PostgreSQL, Redis, PgBouncer, Patroni, etcd, HAProxy, Kubernetes, Argo Rollouts, Grafana and notification accounts require separate compatible infrastructure and credentials. They cannot be run as processes in the current Workers runtime. No cluster, rollback, failover timing, production monitoring or zero-downtime guarantee is claimed.
- Hosted `/signin-with-chatgpt` and `/callback` belong to Sites dispatch. Application code does not replace the platform OAuth flow. Earlier callback 404 logs do not establish a repaired or successfully tested sign-in flow.

## Verification

Automated tests cover enrolment, payment/credit, assessment restrictions, exemptions, live media authorization, audience capacity, signal isolation, microphone policy, media expiry, HLS validation, immutable publication, byte ranges and background queue account isolation. TypeScript and production builds validate integration. A short synthetic clip was encoded locally to all three HLS qualities as a pipeline check; it was not uploaded as learner content.

Managed browser preview remains unavailable because another managed server owns its assigned port. Authenticated multi-device cameras, group audio, Safari/Android buffering, actual relay reachability, provider payments and load/failover tests remain unverified. Passing service tests does not establish those operational results.


## Large-class extension

See `SCALING.md` for the new SFU lecture mode, 2,000-learner default/5,000 admission ceiling, paginated class and learner views, set-based access/roster queries, and verified local 600-learner/551-class fixtures. The earlier ten-audience limit still describes only small-group browser media. The large-class implementation requires provisioned LiveKit settings, signed webhooks, external minute-level housekeeping and real HTTP/media acceptance testing; it is not a production capacity certification.

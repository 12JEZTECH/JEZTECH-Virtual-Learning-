# Large classes and 500+ learners: implementation and acceptance

## Capacity controls

New timed lessons have a learner capacity setting (default 2,000; maximum 5,000). This is an admission bound, not a certified production throughput figure. The class can be used for attendance, shared notes, protected clips, assignments and questions by more than 500 admitted learners. Exemptions, enrolment removal, assessment restrictions and verified subscription checks continue to apply.

Select **Prepare a lesson → Live media mode → Large class · server media**, then set the intended learner capacity. Large-class video uses a LiveKit-compatible SFU instead of creating a teacher-browser peer connection for every learner. The teacher publishes camera, microphone and/or lesson screen to the SFU; learners watch and listen. Up to eleven individually approved learner microphones can publish at a time. Audience camera publishing is disabled in this lecture mode. The existing small-group mode remains available for up to ten audience connections.

The SFU room's participant bound is the learner capacity plus ten staff slots. Each lesson receives its own deterministic, isolated room. The application signs short-lived room-join tokens with verified account identity, specific room and restricted publication sources; learners receive no room-administration or data-publication grant. A token cannot override admission, current class, subject exemption, tuition expiry or an active exam. A fresh application authorization check renews the browser's local permission window approximately every 25 seconds. Clients disconnect on expiry or after losing authorization checks for at most 75 seconds.

## Production media prerequisites

The source integration is implemented. No LiveKit account/server, subscription or quota was created by this update. Before accepting a 500+ live-video audience:

1. Operate a reachable LiveKit SFU (managed or self-hosted), with a verified participant quota and network/bandwidth capacity for the expected rooms, viewers and active speakers.
2. Configure the Site's secure runtime settings: `LIVEKIT_URL` (a root `wss://` origin), `LIVEKIT_API_KEY`, and secret `LIVEKIT_API_SECRET`. Keep credentials out of chat, source code, browser configuration and logs. Redeploy after configuring hosted runtime values.
3. Configure the signed LiveKit webhook at `/api/large-class/webhook`. Requests must carry the provider's valid authorization signature and matching body hash. Webhooks re-authorize a joining/publishing participant in bulk-query policy code rather than retrieving the whole room for each event.
4. Configure an external minute-level housekeeping caller for `POST /api/large-class/reconcile`, authenticated with `X-Workspace-Service-Token` matching the Site's `WORKSPACE_SERVICE_TOKEN`. Any Sites service-access bearer is sent only to this Site. This external job must keep calling while the response has `pending > 0`, with retries/backoff on failures. The endpoint processes up to 25 rooms per request with bounded concurrency and at most 20 participant changes per room and prioritizes ended/orphaned rooms. It is ready for an operated scheduler; this update did not create or resume a schedule.
5. Verify webhook delivery, minute-level housekeeping, participant removal, teacher disconnect and lesson/subscription expiry before general use. Participant tokens alone do not disconnect an already connected SFU session when their join-token TTL expires. Server moderation and housekeeping are required.

Teacher pages supervise their connected rooms. D1 leases prevent duplicate supervisors. One SQL pass checks participant access and a second SQL pass selects the bounded approved speaker list, independent of participant count. Moderation removes revoked viewers, applies source/publication restrictions and deletes ended or orphaned rooms. Each moderation cycle limits external updates/removals to 100 and reports remaining work. Provider failures leave the lease retryable rather than claiming a completed moderation operation. The external housekeeping caller handles rooms even when the teacher page is closed. The existing authenticated learning automation tick also exposes media reconciliation, but its earlier paused schedule is left unchanged.

Provider configuration names are shown when missing. The UI does not silently substitute the small peer room when the SFU is unavailable.

## Database and update changes

- Normal paid-access refresh computes entitlement from authoritative verified subscriptions/receipts/conference passes in one SQL read. Stable access does not rewrite `learner_access`; initial grants remain frozen and revocations remain authoritative.
- Bulk enrolment uses one set-based insert for genuinely missing records and preserves explicit removals.
- Ordinary classroom clock checks and frame cleanup do not submit empty write batches.
- Bulk subscription/admission revocation uses a bounded statement batch instead of one query/write sequence per learner.
- Student classroom snapshots return at most 50 recent online names and no staff enrolment/library data. Full-class totals remain available. Student lesson boards return the learner's own attendance/check-in row plus aggregates; they do not download other learners' camera rows.
- Staff roster pages show 50 learners; admin classroom and class-hub pages show 50 classes. Admin totals cover all open rooms, including beyond the first 500. The class hub searches the whole selected class before pagination. CSV exports are explicitly labelled as the current page.
- Class-hub rosters and admin live summaries use set-based queries rather than an application query per learner/class.
- Classroom streams check at roughly 15-second, jittered intervals. Unchanged snapshots send only a clock event. Dashboard refreshes run roughly every 30 seconds while visible; assessment and presence heartbeats remain separate. Polls do not overlap on slow requests.
- Additional indexes cover admitted teaching groups, active subscriptions, learner assessment states, active class enrolments, lesson deadlines, recent attendance, camera expiry and SFU reconciliation.

All application-specific student data stays behind the Site's existing verified sign-in and authorization. The new service endpoint accepts only the configured service credential; the public SFU webhook accepts only a provider-verified signature.

## Local verification and its limits

Run `node --test tests/service.test.mjs tests/curriculum.test.mjs` and `node node_modules/typescript/bin/tsc --noEmit` from the checkout.

The local SQLite/D1-adapter suite includes:

- One classroom with 600 admitted, paid, joined learner fixtures.
- 600 snapshot service calls in batches of 30 promises: 10,200 SQL reads, zero SQL writes, a largest response of 3,844 bytes in the recorded fixture. Timing varies by host; it is not a production HTTP capacity result.
- 551 simultaneous lesson records and paged admin/class-hub queries, without a database call per class.
- A 600-learner bulk revocation using a bounded SQL batch.
- 600 SFU participant policies checked in two SQL reads, with at most eleven learner speakers.
- Isolated token room grants, viewer/publication restrictions, mocked provider moderation, ended-room deletion, supervision leases, retries and configured lesson capacity.

Fixtures live only in the in-memory test database. They are not inserted into the live school database. The SFU tests use an injected provider adapter; they do not establish real media-server throughput.

## Real HTTP and media acceptance

`scripts/load/classrooms.mjs` is a read-only authenticated HTTP runner for this Site. Supply authorized learner session cases on stdin from a secure credential source: an object with `cases` (each containing `classId` and `cookie`), `concurrency`, and `rounds`. It never prints credentials, identities or response bodies. It produces status counts and p50/p95/p99 latency. It does not create learners, issue payments or forge platform identity headers. Obtain the necessary authorized test sessions separately; no such production test sessions were supplied in this task.

Exercise at least 600 real authorized learner sessions across multiple rooms, then the intended per-room audience, at graduated concurrency. Record error rate, p95 latency, timeouts, D1 rows/CPU, Worker limits and media-provider connection/subscription limits. Test the busiest teacher roster and admin monitor concurrently with learner activity. Media tests must independently measure join success, bitrate, audio continuity, screen sharing, reconnect behavior and moderation/expiry at the intended audience size and on representative phones/networks.

A production claim for 500+ simultaneous live viewers remains unverified until those tests pass against the provisioned infrastructure. Managed browser preview is unavailable in this workspace because another managed server occupies its assigned port; visual/browser and real multi-device acceptance remain incomplete.

## Primary implementation references

- https://docs.livekit.io/frontends/reference/tokens-grants/
- https://docs.livekit.io/reference/other/roomservice-api/
- LiveKit server SDK and client SDK types shipped with the pinned installed dependencies.

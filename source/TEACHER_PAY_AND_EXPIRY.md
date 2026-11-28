# Paid access expiry and teacher pay

## Learner expiry

Student dashboards, lesson rooms and conferences now have a server-authorized access boundary. It checks paid access every 15 seconds, uses server time plus a monotonic browser timer, and unmounts the workspace and its media when entitlement expires. Learners see the expiry and a renewal link. Device and media cleanup run on unmount; renewal keeps the learner's verified sign-in identity and saved work.

An expired access-state request closes local attendance, camera frames, one-to-one calls, conference peers and signaling. It also requests removal from up to 20 active SFU rooms. Existing teacher supervision and the external media reconciliation route enforce provider-side removal. A modified browser, closed tab or provider/network outage cannot be controlled by a browser timer alone: the deployment still requires the minute-level SFU housekeeping described in SCALING.md. Offline clients fail closed after 75 seconds without renewed authorization. Previously downloaded content or another person's shared screen cannot be recalled.

Tuition renewal may extend entitlement, but old or revoked payment codes cannot bypass authoritative subscription checks. Registration payments remain separate. Authorized conference passes expire at their own deadline.

## Teacher agreement workflow

Open **Teacher pay & agreements** in **Accounts & fees**.

1. Administrator proposes a named active teacher's pay rate in KES, a future start, an exclusive end date and payment terms. No rate is assumed or seeded.
2. The named teacher reviews and accepts or declines. Admins cannot accept on their behalf. Overlapping accepted periods are rejected atomically.
3. A future accepted period can be revised through a new proposal. The original stays effective until the teacher accepts the replacement. A period that has started retains its original rate. To change later pay, propose a new non-overlapping future period.
4. Only the admin can calculate provisional earnings and finalize after the period ends. Finalization freezes the learner IDs, count, rate and amount; retries reuse the same statement.
5. After paying externally, the admin records the actual transfer reference and confirms the full amount was paid. The record is immutable and the reference cannot be reused. This operation sends no money and invokes no M-Pesa B2C API.

### Counting basis

Each distinct learner counts once per teacher/pay period across that teacher's classes. The learner must have joined a started lesson, remained present into the live period, and had verified tuition coverage at the qualifying attendance time. Coverage must already have been verified then. Unverified, revoked and expired-before-attendance tuition does not qualify. Free conference passes and registration fees never count. Repeated lesson visits do not multiply the amount.

The formula is **qualifying learners × agreed KES rate**. Amounts use integer cents. No deductions, tax, salary minimum, benefit or employment classification is inferred. Contract/tax arrangements remain the parties' responsibility. Issued statements preserve their original evidence if tuition records later change; financial corrections require an accountable separate process rather than editing historical records.

### Scope and verification

Teachers can review their own agreement terms and acceptance history. Payment statements, transfer references, provisional earnings and monetary reports are admin-only. New service tests cover role isolation, acceptance, prospective revisions, overlapping periods, distinct learner counting, immutable statements and payment recording, plus access-expiry cleanup. Test-only fixture records are never written to production.

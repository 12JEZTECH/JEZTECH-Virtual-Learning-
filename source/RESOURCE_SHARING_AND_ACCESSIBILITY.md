# KICD resources, company agreements and accessibility

## Teaching with official resources

Open **KICD lesson resources** from Learning, the Teaching workspace or the class-chat toolbar. Choose a teaching class and start its lesson. Select a verified KICD or Kenya Education Cloud resource, write what learners should read/watch/discuss, then share it. The live classroom also includes this panel, so voice/video communication can remain open. Learners explicitly open an external resource in another tab or play one of the six registered source-hosted practical clips inside the lesson. No automatic redirects or unsolicited media playback occur.

Only resources registered in the server-side catalogue are accepted. Teachers cannot insert arbitrary URLs, scripts or redirects. Resource lists use class/subject matching and bounded pages. Sharing requires the class owner or an admin and a live session. Student access additionally requires current paid entitlement, matching admission/enrolment/subject selection, joined attendance and no active assessment. Withdrawal, expiry or lesson closure removes the in-app resource entry. An external public resource remains controlled by its publisher; JEZTECH cannot revoke publisher-site access.

Sources checked 1 November 2026:
- https://kicd.ac.ke/cbc-materials/curriculum-designs/regular-curriculum-designs/
- https://kicd.ac.ke/cbc-materials/curriculum-designs/grade-twelve/
- https://lms.kec.ac.ke/
- https://lms.kec.ac.ke/course/index.php?categoryid=232
- https://lms.kec.ac.ke/course/index.php?categoryid=344

## Missing topic imports

The existing catalogue has 136 course outlines and 2,140 topic headings. Thirty-three additional Grade 12 designs are linked but cannot be downloaded: every source returned an explicit owner-disabled download response on 1 November 2026. `app/curriculum/import-status.json` records each class, subject, viewer URL, date and blocker. The curriculum page displays the complete gap list and retains authorized CSV/TXT imports. No headings were fabricated, no restricted download was bypassed and no full-note completeness is claimed. Obtain an authorized export or publisher permission to finish those imports. Some earlier outlines remain third-party/older-edition references and need comparison with current official designs.

## Company–teacher agreements

**Teacher pay & agreements** now includes company name, authorized representative, teacher name, duties, payment schedule, notice/dispute process and safeguarding/resource-use terms. Rate and period remain linked to the proposal. The named teacher must explicitly acknowledge the agreement and type the agreed teacher name to accept. The authenticated account and acceptance time are recorded. Future revisions require fresh acceptance; accepted historical statements remain fixed. Existing pay-only agreements remain readable. Print agreements using the displayed print/save-PDF button. The form records parties' supplied terms; no enforceability, employment classification or tax conclusion is asserted.

## Access protection

Existing server role gates remain in place for `/admin`. Core account/state operations now re-read the stored role and disabled status rather than trusting a caller's role object. Account-management operations independently require a current admin. Tests cover forged admin claims, disabled users and cross-teacher resource isolation. Public sign-in choices are not authorization grants.

## Accessibility and performance

- Device-local larger-text, higher-contrast and reduced-motion settings.
- Keyboard-accessible reading-settings dialog, focus return, Escape handling and a skip-to-main control.
- Focus moves to the dashboard section heading after menu navigation.
- Descriptive resource labels, explicit new-tab notices and written teaching instructions beside clips.
- Media, analytics and upload sections split into lazy-loaded modules.
- Speaker controls load when their drawer opens.
- Online learner/admin-monitor modules wait until near the viewport; a keyboard-accessible load button is also available.
- Existing native media controls, no autoplay, reduced-motion handling, roster pagination and no-preview-download policies remain.

This is not a full WCAG conformance claim. Third-party resource viewers, clips and captions remain under publisher control, and authenticated multi-device assistive-technology testing remains necessary.

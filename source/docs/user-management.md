# Edit and delete registered users

Admins open People & access to search registered users, edit full names, assign student/teacher roles and enable or disable access. Verified identity email is read-only. Administrator accounts cannot be edited, deleted, restored or demoted through these controls.

Delete user requires typing the exact account email. Deletion is recoverable: it sets deleted_at, disables sign-in, removes the account from the active view and retains payment, learning and attendance records. It closes active classroom presence/calls and ends teaching sessions owned by that account. Deleted users are listed separately with Restore user. Restoration keeps the account disabled until the admin explicitly enables it with Edit user. Older role changes and teacher toggles cannot restore a deleted account implicitly.

Every edit, access change, deletion and restoration records the acting admin, target user, timestamp and before/after profile state in user_account_audit. No sign-in credentials are stored there. These controls add functionality; deploying them does not edit or delete any existing account.

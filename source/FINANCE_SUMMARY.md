# Admin finance summary and payment visibility

The admin Overview contains a compact collections and teacher-pay summary. **Accounts & fees → Finance summary** shows a complete breakdown and paginated teacher rows.

- Collected: distinct verified registration, tuition and lesson receipts, in KES. Pending/rejected receipts do not count. Expired access does not erase money previously collected.
- Confirmed STK intents are not summed separately: their saved payment records are already counted.
- Matching copies of a normalized stored receipt count once. Conflicting amounts, learners, categories, missing receipts or invalid amounts are excluded and flagged for reconciliation. Different references that describe the same real-world payment still require administrator reconciliation.
- Teacher payments due: finalized unpaid statements.
- Provisional earnings: qualifying attendance under accepted agreements without a finalized statement, up to the report time. These are shown separately and never added to finalized dues twice.
- Payments recorded: statements the administrator has marked paid externally.
- Calculated collection differences are not bank balances or profit: other expenses, refunds and unrecorded transactions are outside this report.

Only a current enabled admin can read the finance endpoint, ledgers or payout details. Teacher/student workspace payloads contain empty receipt-ledger arrays; registration returns only the learner's own pending/verified status so duplicate payments can be avoided. Students can still see the posted price, request a payment prompt, submit their own receipt, check a current payment operation and renew access. Completed transaction history is hidden from them. Teachers can review and accept their own company/rate terms, but cannot retrieve payout statements, payment references, learner payment ledgers or financial totals. Teacher acceptance history remains available; payment-history events are admin-only.

Lesson receipt verification is admin-only. Application and service checks re-read stored roles; menu visibility alone is not treated as authorization. No external transfers are initiated by the report.

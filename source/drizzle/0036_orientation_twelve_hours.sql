-- Extend existing registration orientation grants without resetting the original start.
UPDATE learner_orientation
SET expires_at = MAX(expires_at, started_at + 43200000)
WHERE expires_at < started_at + 43200000;

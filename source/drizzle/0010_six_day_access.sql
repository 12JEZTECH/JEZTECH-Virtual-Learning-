-- New subscription purchases use six days. Preserve prices and existing paid grants.
UPDATE subscription_settings SET days=6 WHERE id='main';

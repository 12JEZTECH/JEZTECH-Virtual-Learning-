# Registration sign-in guidance

The owner selected email/phone registration contact options while retaining Sites-managed ChatGPT sign-in. A subsequent report identified a password prompt during phone registration. Phone contact is not a separate JEZTECH password account: the prompt belongs to the managed ChatGPT authentication step.

Anonymous student, admission and teacher registration links now render a public two-step introduction instead of immediately redirecting to authentication. It explains the identity step, contact selection, and administrator review, and provides an explicit top-level Continue with ChatGPT link using the existing safe return-path helper. Signed-in visitors still receive the original authenticated forms. Form labels now say Preferred registration contact; login copy also explains that the phone choice does not create another password.

The platform-owned /signin-with-chatgpt, /signout-with-chatgpt and /callback routes remain unchanged. No password is created, collected, stored or reset by JEZTECH. No independent phone/password authentication has been added. Existing API authorization and account restrictions remain in place.

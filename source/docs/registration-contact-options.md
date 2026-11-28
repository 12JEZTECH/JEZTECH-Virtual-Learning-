# Email / phone registration contact options

Students and teachers can choose Email address or Phone number in their existing registration form. Email contact uses the verified signed-in account email and does not require a phone number. The API ignores client-supplied email replacements. Phone contact requires a valid Kenyan mobile number; local 07/01 and international +254 forms are normalized to the existing 254 format. Unused phone input is not retained for the email branch.

Preferred contact is persisted on admissions and teacher_applications and displayed during admin review. Existing registrations default to phone contact to preserve their prior behavior. Teacher approval copies the existing verified account email and selected phone contact into its teacher account as before; choosing email does not grant a teacher role automatically. Student admission approval, registration fees, orientation and tuition rules are unchanged. M-Pesa payment forms ask for a payment number separately when needed.

As selected by the owner, these are registration contact options. Sites-managed ChatGPT sign-in remains the identity method. This change does not add password accounts, email links, SMS codes, delivery integrations or automatic messages. Phone format validation is not proof of phone ownership.

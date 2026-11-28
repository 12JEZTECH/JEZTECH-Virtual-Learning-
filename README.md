# JEZTECH Virtual Learning

The latest published application source (Site version 69) is in `source/`. The older v19 ZIP is retained for reference. `SOURCE_VERSION.json` identifies the original source commit.

Live platform: https://jeztech-learning.jezreelch.chatgpt.site

## Hosting compatibility

This application uses Vinext/React on Cloudflare Workers, a D1 database, R2 storage, and platform-managed ChatGPT identity. It is not a static site and cannot be deployed unchanged to Netlify or a standard Render Node/Python service.

A full move needs a verified identity provider and server-side session/role validation, D1/R2 adapter replacement or explicitly configured remote access, a backed-up and verified learner/payment data migration, payment callback configuration, LiveKit configuration, and end-to-end checks before switching traffic. Do not trust client-supplied identity headers. Do not put API secrets into frontend build variables.

The existing Render service points to the separate `12JEZTECH/jeztech-unified-system` repository, branch `jeztech-learning-production`; it is not the same implementation. This source publication does not replace that service or copy its database.

## Verification

The published version passed 282 tests, TypeScript checking and a production build before its original publication. This export preserves the tracked source files without runtime secrets, learner records, or payment data.

See `source/README.md` for application features and development guidance.

## Render entry address

The free static Render entry is https://jeztech-learning-portal.onrender.com . It opens the existing JEZTECH Site and keeps its login and data. `/clips/` opens the authenticated clip library. Every uploaded clip in the library has a protected link; copy or download all accessible links from Learning videos.

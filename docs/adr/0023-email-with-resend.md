# 0023: Sign-in email through Resend

- Date: 2026-10-30
- Status: Accepted

## Context
Sign-in links (ADR 0022) are emailed by Supabase Auth. Supabase's built-in sender allows
2 emails an hour and sends only to the project's team members, so real users could not
sign in. Supabase also would not let the hosted email templates be edited until custom
SMTP was set up. Auth needs an SMTP server that inboxes trust for `peerreview.club`.

## Options considered
- **Resend.** Simple setup, connects to Cloudflare to create its DNS records, and the
  largest free tier of the transactional services considered.
- **Postmark.** Strong delivery reputation for transactional email, but a small free tier.
- **Amazon SES.** Cheapest at volume, but needs an AWS account, and new accounts send only
  to verified addresses until AWS approves them.
- **Gmail or Google Workspace SMTP.** Low daily limits, and ties sign-in to a personal
  mailbox.
- **No email.** Google sign-in only. SPEC section 1 lists email links, so a sender is
  needed either way.

## Decision
- Resend sends Supabase Auth's email for both Supabase projects, from
  `signin@peerreview.club` ("Peer Review" in production, "Peer Review (staging)" in
  staging). The address has no inbox; replies go nowhere.
- `peerreview.club` is verified in Resend with DKIM (`resend._domainkey`), the sending
  CNAMEs `send` and `rsend` (to `forge.rmta.net`, DNS only), and DMARC `_dmarc`
  (`v=DMARC1; p=none;`), all in Cloudflare.
- Each Supabase project has its own Resend API key with sending access to
  `peerreview.club` only (`supabase-production`, `supabase-staging`), used as the SMTP
  password with `smtp.resend.com`, port 465, username `resend`. Either key can be revoked
  alone.
- Supabase's own email rate limit is raised from its default of 30 an hour to 100 an hour
  in both projects.
- The app never calls Resend. Switching provider means changing the SMTP settings and DNS
  records, not code.

## Consequences
- Resend's free tier caps transactional email at 3,000 a month and 100 a day, with 10
  API requests a second and 3 domains (Resend's usage page, 2026-10-30). Past a cap,
  sign-in stops working until the next day or month, or a paid plan.
- Both projects share one Resend account and its daily cap, so staging tests count
  against production's allowance.
- DMARC is `p=none`, which only reports. Tighten to `p=quarantine` once sign-in email has
  run cleanly for a while.
- Auth's per-IP limits still see the Vercel function's IP for every user. Forwarding the
  user's IP (`Sb-Forwarded-For`) is left in `TASKS.md`.

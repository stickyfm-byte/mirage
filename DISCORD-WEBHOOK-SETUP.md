# Mirage Discord Applications — GitHub Pages setup

This patch is designed for the current `stickyfm-byte/mirage` repository, whose application form is `forms.html`. GitHub Pages cannot execute PHP, so use a Cloudflare Worker as the private webhook relay.

## 1. Add the Worker

1. Sign in to Cloudflare and open **Workers & Pages**.
2. Create a Worker named `mirage-applications`.
3. Replace its starter code with `cloudflare-worker/worker.js` from this package and deploy it.
4. In the Worker, open **Settings → Variables and Secrets** and add:
   - Type: **Secret**; Name: `MIRAGE_DISCORD_WEBHOOK`; Value: your newly regenerated Discord webhook URL.
   - Type: **Text**; Name: `ALLOWED_ORIGINS`; Value: `https://miragesmp.org,https://www.miragesmp.org`
5. Deploy again after adding the secret/configuration. Add your actual site origin to `ALLOWED_ORIGINS` if it differs. Use exact origins only (scheme + hostname, no path).
6. Copy the Worker HTTPS URL, for example `https://mirage-applications.<your-account>.workers.dev`.

**Security:** The webhook URL was shared in a previous chat. Regenerate it in Discord before using it. Never put it in GitHub files, JavaScript, HTML, or a public GitHub Actions variable.

## 2. Connect the form

In the repository:

1. Upload `assets/application-submit.js` to the existing `assets/` folder.
2. Open `forms.html`. Find the `<form ... id="applicationForm" ...>` opening tag and change its `action` to `action="#"` (keep `method="POST"`).
3. Remove any old FormSubmit-only hidden inputs such as `_subject`, `_template`, and `_captcha` if present. Keep the `_honeypot` field if the form has one; the Worker silently discards filled honeypots.
4. Near the end of `forms.html`, before `</body>`, add:
   `<script src="/assets/application-submit.js" defer></script>`
5. In `assets/application-submit.js`, replace `https://REPLACE-WITH-YOUR-WORKER.workers.dev` with the Worker URL you copied.
6. Commit the changes to `main` and wait for GitHub Pages to publish.

The form fields should keep their current `name` values, including `Role`, `Minecraft Username`, `Email`, `Discord`, `Age`, `Application`, and the Script Writer-specific names. The worker forwards all recognized fields in one colour-coded Discord embed and disables mention parsing.

## 3. Test safely

- Submit one test application with non-sensitive test values.
- Confirm the embed arrives in the intended private staff channel.
- Confirm a failed delivery shows an error instead of redirecting to the thank-you page.
- Check all role tabs (Actor, Trusted, Builder, Script Writer).
- Keep the Discord channel restricted to authorised reviewers because applications contain personal information.

## Notes

- The Worker sends notifications to Discord; this patch does not preserve FormSubmit email delivery. If you still need email notifications, add a separate server-side email provider rather than exposing email credentials in browser code.
- A public static form endpoint can receive spam. The Worker includes a honeypot, origin allowlist, input limits, and validation, but production use should also add Cloudflare rate limiting or Turnstile if spam becomes a problem.
- This patch bundle contains the new Worker and browser script, not a full replacement of the repository. Follow the steps above to add them to the existing site without replacing its design or assets.

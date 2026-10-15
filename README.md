# Mirage Productions

Single-page Mirage Productions website.

## Included

- Supplied Mirage logo
- Smooth eased blue gradient background with slow-drifting colour glow and fine grain (no banding)
- Live player count for mc.miragesmp.org
- Endless video rail (13 videos): thumbnails only, eased hover slow-down, drag/swipe with momentum, staggered entrance. Add a video by appending its YouTube ID to `videoIds` in app.js
- Four creator cards with independent 3D Minecraft skin viewers
- Automatic skin rotation
- NameMC and YouTube links for each creator
- Actor, Trusted and Builder applications
- Content Disclaimer
- EULA link
- Discord link
- Custom 404 page (`404.html`, wired in `.htaccess`) with Shimmy, the Mirage heat-haze mascot: eyes follow the cursor, click to poke, rippling reflection

## Skin loading

For creators whose Minecraft UUID is on file, the viewer requests the skin by UUID first (mc-heads.net, then minotar.net, then crafatar.com), since UUID lookups skip each host's username->UUID cache and stay correct even right after a name change. It then falls back to the same three hosts by username for creators without a stored UUID, and shows a "Skin unavailable" placeholder only if every source fails.

## Run locally

Use a local web server for the most reliable external API behavior:

python -m http.server 8000

Then visit http://localhost:8000

The application form uses FormSubmit and targets applications@miragesmp.org. FormSubmit may ask for an initial email confirmation.

## Privacy, sharing and forms
- `assets/consent.js` shows the welcome / cookie banner on every page. Google Analytics (G-8CP2K9MB7N) is only loaded after a visitor chooses "Accept all"; "Essential only" keeps it off, and the footer's "Cookie settings" link reopens the choice (and clears the analytics cookies when switching off).
- Applications redirect to `/forms/thanks/` (Shimmy's thank-you page) via FormSubmit's `_next` field, and a hidden `_honeypot` field catches basic spam bots.
- Link previews: every page has Open Graph / Twitter tags pointing at `assets/og-image.jpg` (1200x630), plus `sitemap.xml` and `robots.txt`. They assume the site lives at https://miragesmp.org, so change that base URL if it ever moves.
- `404.html` and the thank-you page share `assets/shimmy-page.css` and `assets/shimmy.js`.


## Discord application notifications

Application submissions are sent to Discord by `submit-application.php`. The webhook URL is read from the server environment variable `MIRAGE_DISCORD_WEBHOOK`, never from browser JavaScript.

### Deployment checklist

1. **Regenerate the webhook in Discord first.** The previous URL was shared in a chat, so treat it as compromised.
2. Configure the new URL as the server environment variable `MIRAGE_DISCORD_WEBHOOK` in your hosting control panel. Do not put it in `forms/index.html` or `app.js`.
3. Ensure hosting supports PHP 7.4+, the cURL extension, and outbound HTTPS.
4. The handler also attempts to email `applications@miragesmp.org` using PHP `mail()`. Confirm mail is configured by the host; otherwise configure an SMTP mailer.
5. Test with a sample application and confirm the embed arrives in the intended **private staff-only channel**. Application submissions contain personal information, so restrict access to authorised reviewers.

The handler sends one Discord embed per submission, with the available form fields and timestamp. Discord delivery failures are logged server-side and shown to the applicant. Static-only hosting cannot run this PHP handler.

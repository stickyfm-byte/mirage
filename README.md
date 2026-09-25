# Mirage Productions

Single-page Mirage Productions website.

## Included

- Supplied Mirage logo
- Light-to-dark blue gradient background
- Live player count for mc.miragesmp.org
- Four YouTube video previews
- Four creator cards with independent 3D Minecraft skin viewers
- Automatic skin rotation
- NameMC and YouTube links for each creator
- Actor, Trusted and Builder applications
- Content Disclaimer
- EULA link
- Discord link
- Responsive layout

## Skin loading

For creators whose Minecraft UUID is on file, the viewer requests the skin by UUID first (mc-heads.net, then minotar.net, then crafatar.com), since UUID lookups skip each host's username->UUID cache and stay correct even right after a name change. It then falls back to the same three hosts by username for creators without a stored UUID, and shows a "Skin unavailable" placeholder only if every source fails.

## Run locally

Use a local web server for the most reliable external API behavior:

python -m http.server 8000

Then visit http://localhost:8000

The application form uses FormSubmit and targets soobiem12@gmail.com. FormSubmit may ask for an initial email confirmation.

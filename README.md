# Mirage Productions

Single-page Mirage Productions website.

## Included

- Supplied Mirage logo
- Minecraft themed underwater background with subtle caustics, reefs, bubbles and fish
- Live player count for miragemultiverse.datho.st
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

The creator cards first request the current skin texture from Ashcon's public Mojang profile API. If that request is unavailable, the viewer falls back to mc-heads.net.

## Run locally

Use a local web server for the most reliable external API behavior:

python -m http.server 8000

Then visit http://localhost:8000

The application form uses FormSubmit and targets soobiem12@gmail.com. FormSubmit may ask for an initial email confirmation.

# Mirage Editor

Open https://miragesmp.org/admin/ to edit the site without touching code.

It edits `content.json` in this repo and commits it to `main` through the GitHub API. GitHub Pages then republishes the site (about a minute). No database or server is needed.

## One-time setup
1. GitHub > Settings > Developer settings > Fine-grained tokens > Generate new token.
2. Repository access: only `stickyfm-byte/mirage`. Permissions: Contents = Read and write.
3. Paste it into the editor's sign-in (tick "Remember" on your own device only).

## What you can edit
Homepage text, video rotation (paste YouTube links, drag to reorder, speed), creators, status board (green/yellow/red), changelog, disclaimer and EULA, footer links and emails, server address, Discord link, announcement banner.

## Notes
- If `content.json` can't load, the pages show the text already in the HTML, so the site never breaks.
- "Work offline" + "Download JSON" lets you edit with no token; commit the downloaded file yourself.
- Anyone can open /admin/ but cannot save without a token with write access. Revoke the token on GitHub to cut access.

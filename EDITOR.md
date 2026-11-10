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

## Application editor (Applications tab)
Roles, questions and form text are stored in `content.json` under `forms`. For each role you can set: name, open/closed, an automatic close date, a closed message, the Discord message colour, the intro text, and a list of questions. Question types: short answer, long answer, number, email, link, dropdown, choose one, choose many, yes/no. Each question can be required or optional, full or half width, and have help text, a placeholder and a maximum length. New roles can start from a template or copy an existing role. "Preview" shows the real form with your unpublished edits.

## Deploying the worker (do this BEFORE pushing the site)
The Cloudflare worker in `cloudflare-worker/` now reads the form definition from the live `content.json` and checks every submission against it. If it can't load the definition it falls back to the old built-in rules, so applications keep working.

1. `cd cloudflare-worker && npx wrangler deploy`
2. Check an application still arrives in Discord.
3. Then commit and push the site files.

Doing it in this order matters: the new form uses the new question wording, which an old worker would reject.

Long applications are split across several Discord messages (up to about 12,000 characters in total).

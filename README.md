# The DPS Throne 👑

A personal Genshin Impact DPS testing hall of fame, published as a static website.

## Features
- Leaderboard, character profiles, full test archive, head-to-head comparisons and test protocol
- **All Characters** gallery with 127 official Genshin Impact in-game character icon references, elemental filters, search and quick access to tested or untested characters
- Official game-asset portraits in the leaderboard, podium, test archive, profile views and duel comparisons; missing images fall back to initials, never fan art
- Read-only Google Sheets synchronisation via your own Google sign-in
- Browser-local cache and data exports; no account-owned database or backend
- Test timing and evidence badges, including the approved Mitya 67.47-second exception

**Privacy:** The public website source does **not** contain the private 53-run test dataset or any Google OAuth secrets. The source spreadsheet remains private. Users must authenticate with a Google account permitted to read it. Data brought into the browser can remain in that browser's local storage.

## Launch
See [SETUP.md](SETUP.md) for GitHub Pages and Google OAuth setup. The homepage is `index.html` and no build step is required.

Source spreadsheet (requires access): https://docs.google.com/spreadsheets/d/1538QSbADzZf0p76qvC1dhhMk8RYO74I51l9G7nQSq_s/edit

Built for the Bankruptcy Archives. The throne cannot survive on spreadsheets alone.

## Artwork provenance
Character names and internal UI image identifiers are based on the Genshin Impact game data exposed through [EnkaNetwork's public API documentation](https://github.com/EnkaNetwork/API-docs). Artwork is © COGNOSPHERE / HoYoverse. This is a non-commercial fan project; **no fan art** is used. Images are remotely loaded from Genshin's official character-icon service and game-asset mirrors (Enka.Network, Hakush.in, and Project Amber) and are not copied into this repository. Newly released characters may display initial-based placeholders until their official UI icons are available on a mirror.

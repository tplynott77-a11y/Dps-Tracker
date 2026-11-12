# The DPS Throne 👑

A personal Genshin Impact DPS testing hall of fame, published as a static website.

## Features
- Leaderboard, character profiles, full test archive, head-to-head comparisons and test protocol
- **All Characters** gallery with 127 official Genshin Impact in-game character icon references, elemental filters, search and quick access to tested or untested characters
- Official game-asset portraits in the leaderboard, podium, test archive, profile views and duel comparisons; missing images fall back to initials, never fan art
- Read-only Google Sheets synchronisation via your own Google sign-in
- Browser-local cache and data exports; no account-owned database or backend
- Test timing and evidence badges, including the approved Mitya 67.47-second exception
- **Damage Lab**: per-test individual damage bars, official character portraits, dynamic percentages, complete/partial validation badges and notable battles
- **Support performance profiles:** every character now records both carry and support appearances, their highest documented personal damage, derived personal DPS, their best qualifying team DPS, and linked run histories. Gallery cards also recognise support-only characters.
- **Royal Chronicle:** timeline of dated, qualifying all-time team DPS records. Distinguishes first known leader, crown changes, and record defences; tests without dates are flagged but never given an invented position.
- **The Royal Record Book:** biggest hit, highest documented personal and support damage, largest documented support share, most appearances, closest challenger, lowest qualifying benchmark (the Basement™), and the longest *superseded* all-time DPS record.
- **Mobile-friendly history:** official character portraits, timeline filters, record staircase chart, source-test links, and a Throne Room shortcut. All computed from your already-authorized private test archive.
- Individual-damage summaries inside the Throne Room, each champion's profile, test detail dialogs and side-by-side Duel Lab comparisons
- Private-source derivation: damage numbers are read preferentially from the structured Support 1/2/3 Damage columns (N, P and R) in the private Google Sheet, falling back to documented historical test notes when no structured value is available. Full four-character breakdowns are accepted only when totals reconcile; missing support numbers stay unattributed.

**Privacy:** The public website source does **not** contain your private test dataset or any Google OAuth secrets. The source spreadsheet remains private. Users must authenticate with a Google account permitted to read it. Data brought into the browser can remain in that browser's local storage.

## Launch
See [SETUP.md](SETUP.md) for GitHub Pages and Google OAuth setup. The homepage is `index.html` and no build step is required.

Source spreadsheet (requires access): https://docs.google.com/spreadsheets/d/1538QSbADzZf0p76qvC1dhhMk8RYO74I51l9G7nQSq_s/edit

Built for the Bankruptcy Archives. The throne cannot survive on spreadsheets alone.

## Artwork provenance
Character names and internal UI image identifiers are based on the Genshin Impact game data exposed through [EnkaNetwork's public API documentation](https://github.com/EnkaNetwork/API-docs). Artwork is © COGNOSPHERE / HoYoverse. This is a non-commercial fan project; **no fan art** is used. Images are remotely loaded from Genshin's official character-icon service and game-asset mirrors (Enka.Network, Hakush.in, and Project Amber) and are not copied into this repository. Newly released characters may display initial-based placeholders until their official UI icons are available on a mirror.

## Team Damage Analysis notes
The support-damage fields and test-note parser underpin the Damage Lab. At the latest validation on 12 November 2026, the private sheet held 59 tests; counts recompute from the current sheet after each refresh. The source workbook is **not** edited by the site; read-only Google sign-in is retained. This is a breakdown of **damage dealt**, not proof of support buff value, individual contribution to team DPS, or controlled upgrade effects.

## How the Chronicle works
The chronological sequence uses the **test date** and, only to break same-day ties, the row order from the private Test Log. A test without a known date cannot be placed in history. Only 60-second tests (plus the player-approved MIT-00A exception) are eligible. The earliest dated leader is not claimed to be the account's first-ever champion. The longest *superseded* record is measured in whole calendar days between two logged record improvements; the current record has no invented end date. The website's existing Google OAuth sign-in stays read-only, so all new stats are recalculated in your browser rather than stored publicly.

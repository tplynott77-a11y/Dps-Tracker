# The Bankruptcy Archives · Genshin Operations Centre 👑🌱

A personal Genshin Impact command centre with **two connected departments** under one GitHub Pages website: the original DPS Throne and lighter, paper-and-sage **Farming Operations**.

## The two departments

- **DPS Throne:** original battle record database, 60-second leaderboards, team damage analysis, personal support records, Royal Chronicle and character galleries.
- **Farming Operations:** a warm ivory/sage Command Centre, live project queue, Requirements-based Resin Planner, searchable planning inventory, resin-free objectives and a character roster, all read directly from the existing *Bankruptcy Archives — Farming Priority Tracker (Master)*.
- **Roster filters:** combine text search, exact recorded character level or level thresholds (such as Lv 80+), an element selector, and A–Z / highest / lowest level sorting. Filtered results have a count and clear button; canonical character names and elements come from the existing official-game character catalogue, with unknown elements clearly labelled. Filtering never modifies the Google Sheet.
- **Character build dossiers:** tap any Farming character to see recorded weapon/level/refinement, each artifact slot with main stat and available substats, talents, constellation, and full goal history. The interface reads three *private* workbook tabs: **Build Snapshots** (74 character records), **Build Artifacts** (196 equipped-slot records), and **Build Goals** (six dated user/suggested goals). Older 15 October scan data fills gaps; verified 23 October items and later player reports are preserved with provenance. 'None equipped in scan' is never equated with an unrecorded slot. The local GOOD importer is an optional, browser-only equipment snapshot; it does not silently change the Google workbook.


Open the website and use **Archives Home** to choose a department. They share the same navigation, so a character profile in the Throne can jump directly to a matching farming project search.

### Google sign-in and data privacy

Both private spreadsheets use the *same Google OAuth Web Client ID* and read-only Sheets scope. Sign in to one department then the other can reuse an active OAuth token, or use that department's **Connect Google / Drive Sync** button. Once connected, browser-local copies can remain available between sessions until browser data is cleared.

- **DPS master:** https://docs.google.com/spreadsheets/d/1538QSbADzZf0p76qvC1dhhMk8RYO74I51l9G7nQSq_s/edit
- **Farming master:** https://docs.google.com/spreadsheets/d/1zdi-5X6wL8J-6saDVOOxZLT5O7d52Gm5e0sFgP1p4Mc/edit

**Read-only:** website interactions DO NOT edit either original Google Sheet. All project statuses, inventory updates, resource consumption, and formal records should be changed in Google Sheets. Afterward, refresh the relevant department to see the new results. Public GitHub files intentionally contain no private DPS results or farming inventory values. An OAuth Client ID and spreadsheet IDs are public identifiers, not access credentials. Never commit tokens or client secrets.

**Important limitations:** Farming stock is the planning inventory, NOT a real-time wallet. Some item counts are old or unverified, and the underlying source sometimes retains historical shortages under completed projects. The website preserves existing priority order instead of assuming new priorities. The Resin Planner groups source-documented needs by acquisition type and does **not** fabricate random-drop estimates, resin costs or expected farming days.

The source workbook was checked on 12 November 2026: the original character roster contained 73 entries; an additional confirmed Furina acquisition in Build Snapshots makes 74 visible dossier characters. The imported historical equipment entries are dated to their actual GOOD scan. All counts are read at sync time.


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

**Privacy:** The public website source does **not** contain your private test dataset or farming inventory or any Google OAuth secrets. The source spreadsheet remains private. Users must authenticate with a Google account permitted to read it. Data brought into the browser can remain in that browser's local storage.

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

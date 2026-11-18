# Firmware releases: Signoff FW to Flasher

Status (2026-11-17): Chris agreed and said go. **Built, not committed:** steps 1 to 4 below (the engine in EE,
synced into ME and FW; FW's config and demo; vendored into Fabcheck, PL, Loom, Pincheck, and the hub's
`suite.css`; PL's reader and inspector), and step 5, Flasher (after its slice 1 landed as `c013df2`; Flasher's
README, *Releases from Signoff FW*). **Waiting:** step 6, a live release, at Chris's OK. Flasher's link is
`?release=<review>/<release>`, not `?fw=`, which Flasher already uses for manifest firmware; and
`summary.releases` also carries a withdrawn release's `withdrawnWhy`, for Flasher's warning.

Where the build differs from the first draft of this doc: Restore leaves releases alone (like revision tags,
since a release is something that happened); `file.parts` is a count, not a list (the paths follow from the
name); `meta.load` holds `via` and `board` (the base address stays per release); PL's `P.merge` needs no change
(PL never stores review records); and the demo's versions follow its story (0.8.0, 0.9.0, 0.9.1).

Flasher's side of passthrough systems is agreed in `../../flasher/docs/releases-and-passthrough.md`. This doc
covers its *Signoff integration* section: where a firmware build is kept, who may publish it, and how Flasher
finds it.

## Decisions so far

| Question | Chris's answer (2026-11-17) |
| --- | --- |
| Whose access governs a FW release in Flasher? | **FW sharing.** Anyone who can open the FW target sees its releases in Flasher, including a contractor on a shared target, who can download the binaries. Flasher's People list doesn't add to or narrow it. |
| Who publishes, and are there states? | **FTEs only, with Draft, Released, and Withdrawn.** A draft shows in Flasher to FTEs only, for the bench. Released shows to everyone with access. Withdrawn stays listed with a warning and isn't picked by default. |
| Do `flasher_data` and `publish.py` stay? | **Yes.** They stay for the Arduino examples and other boards' firmware. FW releases are a second source beside them in Flasher's sidebar. |
| Granularity (agreed earlier) | One FW review is one **target**, which is one firmware image. A release is one build of that image. |
| A passthrough demo target? | **No.** The FW demo keeps USB releases on the Main PCBA; Flasher's own demo shows a passthrough release. |
| Does a target name its board once? | **Yes,** in the details window (`meta.load`); each new release copies it and can change it. |

## What a release is

A release is one file (a `.elf`, `.hex`, or `.bin`), a version, notes, and **how it loads**. The file is
written once and never changed. The record around it (its state and notes) is an ordinary review record, so
it merges, shows in History, and can be restored like any other.

### Files: `releases/<reviewId>/<releaseId>/`

The files sit beside the review in whatever repo holds it: `fw_design_review_data`, or `review-fw-<slug>` once
the target is shared. That is why FW sharing governs access: GitHub admits exactly the people who can open the
review.

```
releases/<reviewId>/<releaseId>/release.json
releases/<reviewId>/<releaseId>/<file name>            one file, under 4 MB
releases/<reviewId>/<releaseId>/<file name>.001, .002 …   or in parts (GitHubStore.splitParts)
```

- `releases/` joins `checkerDirs` (`workspace.js`, on when `config.releases` is set), so sharing a target moves
  its releases with `moveChecker`, as it moves `fabcheck/`, `pincheck/`, and `rework/`.
- A file over 4 MB is stored in parts, as Fabcheck's zips are (`GitHubStore.splitParts`; `putFiles` already sends
  blobs of 512 KB or more one at a time and retries a cut-off upload). `model.zipParts` is generalized to
  `model.fileParts` (same rule: the file's own path plus `.001`, `.002`, …, nothing skipped), and `zipParts`
  stays as a name for it.
- The file keeps its original name (cut to a safe set: letters, digits, `.`, `_`, and `-`).

### `release.json`, format 1

Written once with the file, in the same commit. It's the contract Flasher reads, so it carries everything
needed to flash without opening the review.

```json
{
  "format": 1,
  "review": "<reviewId>",
  "id": "<releaseId>",
  "version": "1.4.0",
  "file": { "name": "tstat-main-1.4.0.elf", "kind": "elf", "size": 412318, "sha256": "…",
            "path": "releases/<reviewId>/<releaseId>/tstat-main-1.4.0.elf",
            "parts": ["releases/<reviewId>/<releaseId>/tstat-main-1.4.0.elf.001", "….002"] },
  "load": { "via": "usb", "board": "tstat-main", "base": "0x08000000" },
  "source": { "repo": "owner/name", "sha": "<git sha>", "dirty": false },
  "publishedAt": "2026-11-17T12:05:00Z",
  "publishedBy": "<GitHub login>"
}
```

- `file.kind` is from the extension, checked against the bytes: an ELF starts `7F 45 4C 46`, and an Intel HEX is
  `:`-records only. Anything else is refused at upload. `parts` is there only when the file is split.
- **`load`** says how the build reaches the chip:
  - `"via": "usb"`: the board's own USB (Flasher's DfuSe path). `board` is a Flasher board id when there is one;
    `base` is needed only for a `.bin` (a `.hex` or `.elf` carries its addresses). A board Flasher's manifest
    doesn't know (or that the viewer can't read) flashes as **Any STM32**, which Flasher already does for files.
  - `"via": "passthrough"`: the remote of a passthrough system. `board` is the bootloader INFO's `board` id
    (ASCII, at most 16 bytes, `[a-z0-9-]`), so Flasher can match a connected remote to its releases. **A `.bin`
    can't be a passthrough release**: the remote needs addresses, and the upload form says so.
- `source` is optional and typed by hand (the repo and commit the build came from). `dirty` is a tick box.
- `release.json` never holds the state. The state changes; the file doesn't.

### The record: `project.releases`

```
releases[<releaseId>] = {
  id, version: '1.4.0', state: 'draft' | 'released' | 'withdrawn',
  file: { name, kind, size, sha256, parts },           // parts: how many (0 for one file); paths follow from the name
  load: { via, board, base? },
  notes,                                                 // what changed, up to 4,000 characters
  releasedAt: 'YYYY-MM-DD', withdrawnWhy,
  createdAt, updatedAt, updatedBy, deleted
}
```

- `model.cleanRelease` cleans it as `cleanRevision` does (known states, text cut, hashes checked).
  `model.liveReleases` sorts it (by `createdAt`, then id), and `model.latestRelease(project, { drafts })` picks the
  newest Released one (or the newest draft, for an FTE who asks).
- Versions are free text up to 40 characters, unique among live releases. The next one is suggested from the last,
  as `nextRevLabel` does (1.4.0 → 1.4.1).
- Deleting a release tombstones the record. Its files stay in the repo (and its history), as rework pictures do.

### Every place a record kind is listed

Adding `releases` touches each list that `rework` (the last kind added) touches:

- `model.js`: `mergeProjects` (merged only once either copy has one, so other documents keep their bytes), the
  History record list (line ~229), the `kind` union and `each('releases', …)` (~237, ~270), `HIST_MAP` (~280),
  and `changesSince`. Not `RESTORE_MAPS`: Restore leaves releases as they are, like revision tags.
- `app.js`: `HIST_KEY` and its labels and filters (~2733), the history text for a release (~2748), and the deep
  link kind (`?item=` with `kind === 'release'` opens the Releases tab, ~624).
- `tools/signoff.js`: `MAP_KEYS` (~755), so a CLI push keeps them.
- Not Signoff PL's `P.merge`: that merges PL's own documents, which never hold review records.

### `summary.releases`

For Signoff PL and Flasher, left out while there are none:

```
summary.releases = [{ id, version, state, releasedAt, via, board, kind, size, sha256, path }]   // oldest first, no tombstones
```

`path` is the `release.json` path. PL's reader takes `CACHE_V` 12 (the `me-send` branch now takes 13). The summary only refreshes when someone edits that
review, and publishing or changing a release is an edit.

## The Releases tab (Signoff FW)

Engine code in `ee_design_review` behind `config.releases`, set only in FW's `config.js`. Built like EE's
Revisions tab.

- **The list:** one row per release, newest first: version, state, date, file name and size, how it loads
  ("USB, tstat-main" or "Passthrough, tstat-display"), and who published it. States read as words (Draft,
  Released, Withdrawn), never by color alone; Withdrawn also has a strike-through and its reason.
- **New release** (FTEs only): drop or pick a file, then version (suggested), how it loads, the board id, the
  base for a `.bin`, notes, and the optional source. The page checks the file kind and computes the SHA-256, then
  writes `release.json` and the file (or its parts) in one commit with `putFiles`, as rework pictures are
  written, and only then adds the record, which goes out with the next sync. Progress shows on a `.busy` card. A
  release starts as a Draft, or Released when the FTE ticks *Release now*.
- **Actions on a release:** Download (read with `readVerified`, joined from its parts, refused unless the
  SHA-256 matches), Release (draft → released, stamping `releasedAt`), Withdraw (asks why), Edit notes, Delete
  (FTEs, drafts only; a released build is withdrawn, not deleted), and **Open in Flasher**, which goes to
  `../flasher/index.html?release=<reviewId>/<releaseId>` in the same tab. It shows only where
  `config.releases.flasher` names Flasher's page (Signoff FW's config does).
- **Who's an FTE here:** the same test the engine uses elsewhere (`isFte()`: the token opens the data repo). Clients and contractors see the list and Download, nothing else.
- **Drafts aren't secret.** Hiding drafts from clients and contractors is the page's choice; GitHub still lets
  anyone with the repo read the files. That fits FW sharing governing access: share a target only with people
  who may see its builds.
- **The demo:** `fdemo3` Thermostat Firmware gets three releases on the Main PCBA (`tstat-main`, USB): 0.8.0
  Withdrawn (the display flickers after an OTA reboot), 0.9.0 Released, and 0.9.1 Draft. They're examples
  without files (Download says so); a release added in the demo keeps its file in that tab. Demo `VERSION` 20;
  PL's snapshot carries them.

## Flasher: FW releases as a firmware source

Flasher's sidebar gets a second group kind beside its projects: **Signoff FW**, one folding group per target the
viewer can open, each listing its releases.

- **Finding them.** The same way Signoff PL finds FW reviews: `fw_design_review_data` (FTEs) and every
  `review-fw-*` repo the token can list (PL's `tools` entry: `dataRepo`, `prefix`). Flasher reads each review
  file's `summary.releases` only, caching by blob SHA as PL's reader does, so a sync with nothing new costs one
  tree read per repo. Flasher already vendors `model.js` and `github.js` from EE, which is all this needs; the
  reader is a small new `flasher/assets/fwreleases.js`, not a copy of PL's.
- **Who sees what.** The repos the token opens (FW sharing). Drafts only for FTEs (the token opens
  `fw_design_review_data` or `flasher_data`). Withdrawn releases are listed, struck through, with their reason
  and a warning when opened.
- **Picking one.** The release's `release.json` and file are read with `readVerified` and checked by SHA-256,
  then flashed as a file of that kind is today: `via: usb` through the board named in `load.board` when the
  manifest knows it, else Any STM32; `via: passthrough` only as a passthrough system's remote.
- **Deep link.** `?release=<reviewId>/<releaseId>` opens that release in the Serial bootloader tab.
- `flasher_data`, `review-flasher-*`, and `publish.py` are unchanged.

### A passthrough system's remote can point at a release

Slice 1's remote holds `file: { name, sha256 }`. The firmware becomes a reference with a kind:

```
remote.firmware = { kind: 'file', name, sha256 }
               | { kind: 'fw-release', repo, review, release, version, sha256 }
```

- Choosing the remote's firmware offers the releases whose `load.via` is `passthrough`, matched to the system's
  board id when it has one (INFO's `board`, once a remote has answered). A `.bin` release never appears there.
- The system keeps the release it was given (pinned by id and SHA-256). When a newer Released one exists for the
  same target, the Remote block says "1.5.0 is out" with **Switch**. It never switches by itself.
- After INFO, if the connected remote's `board` doesn't match the release's `load.board`, Flasher stops before
  comparing and says which board answered.
- The file is read from GitHub each run (cached in IndexedDB by SHA-256, as slice 1 keeps local files), so a
  system saved in the browser stays small.

## Build order (after Chris's go)

1. **EE engine** (`ee_design_review`): `config.releases`; `cleanRelease`, `liveReleases`, `latestRelease`,
   `fileParts`; every list above; `summary.releases`; `releases/` in `checkerDirs`; the Releases tab, upload,
   Download, states, and Open in Flasher; tests (cleaning, merge, the summary left out when empty, parts, History,
   Restore, a CLI round trip with a `releases` map). Run `build.py` and EE's tests, and the CLI tests.
2. **FW** (`fw_design_review`): `config.releases` on, with the tab's words; the demo's three releases. Sync the
   engine into ME and FW and run each one's tests (ME keeps it off).
3. **Vendor** per the root CLAUDE.md: `model.js`, `github.js`, and `styles.css` into Fabcheck, PL, Loom, Flasher,
   and Pincheck; stamp each; regenerate PL's snapshot.
4. **PL**: `P.merge` keeps `releases`; the reader's next `CACHE_V`; a firmware Part's inspector shows *Firmware
   releases* (version, state, date), as it shows *Fab revisions* for a board.
5. **Flasher** (after slice 1 lands): `fwreleases.js`, the sidebar group, the deep link, the remote's
   `fw-release` reference, the newer-release note, and the board check. Its demo lists the thermostat's releases,
   built by `catalog.js` as its other demo images are. Tests against `tests/fakegithub.js`.
6. **Tried live**, at Chris's OK: one real release uploaded to a FW target, read back by SHA-256, and flashed from
   Flasher (Compare only first, per Flasher's bench rule).

No data repo is written until step 6, and then only by the page, as an FTE.

## Small questions left for the build

- **A passthrough demo.** The FW demo has one target, the Main PCBA's firmware. Showing a passthrough release
  needs a second demo target, *Display & Sensor Firmware* (`tstat-display`, passthrough through the Main PCBA),
  which means a new FW demo review, PL's demo linking it, and PL's snapshot. Worth it, or leave the passthrough
  release to Flasher's own demo?
- **Board ids.** Flasher's manifest board ids and INFO's `board` ids are separate today. Should a FW target name
  its board once (in the review's details) so every release fills `load.board` from it?

## Later (written up, not built)

- **Signoff PL generates a system.** PL already knows which firmware Part sits on which board, and which boards
  belong to the product. A *Flash this product* action could build a passthrough system from the tree: the host
  is the board whose firmware Part carries the passthrough, the remote is the board updated through it ("Display
  updates through the Main PCBA"), and each block's firmware is the linked FW target's latest Released build. PL
  would hand it to Flasher as `?system=` plus a small JSON in `dovetail-handoff`, as EE hands runs to Fabcheck.
  Needs: a "updates through" link between two PL Parts, and the board ids above.
- **Signoff EE and Loom name the blocks.** A system's Host and Remote could name EE boards (their reviews), so
  the diagram shows real names and pictures. Loom's systems already know which harness joins two boards, so the
  Link block could name that harness, and a check could flag a system whose two boards have no harness between
  them in Loom, or whose passthrough connector is unused.
- **Releases from CI.** A workflow in a firmware repo could publish a Draft through the same `release.json`
  contract, with a fine-grained token, so the build server uploads and an FTE only clicks Release.
- **Saving systems** in a data repo (Flasher's slice after this), at which point a saved system's
  `fw-release` reference is what makes it shareable.

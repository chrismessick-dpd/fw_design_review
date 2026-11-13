# Scribe FW: the description tab in Signoff FW (design)

2026-11-08. Status: built and pushed (Signoff FW, and the shared engine in EE).
The tab is called **Scribe** (Chris, 2026-11-08: "it's now a little tool, and we'll have Scribe EE and Scribe FW"). It was
first "Plain Text Requirements", then "Description". Data keys stay `spec`. *The prototype* below says what was built and where it differs from this design.

## Why

A list of requirements is hard to read as "what does this firmware do". A written description, from
the product down to the drivers, is easy to read but drifts away from the requirements. This tab is
one free-form document per target, tied to the requirements both ways, so it can be read, shared, and
checked for gaps. Nothing else in the suite does this. It explores a way to define firmware, not a
copy of another tool.

Requirements stay exactly as they are (the Requirements tab, `reqList`, PL's flow-down, `&req=` links).
The description works beside them and never deletes or rewrites one on its own.

Outside the suite, the closest systems are Polarion LiveDocs, DOORS Next modules, and Jama documents
(requirements shown as a document), StrictDoc and Sphinx-needs (requirements inside prose, traced
both ways), and the C4 model (the same system at levels of detail). For a medical product, the
document can grow into the IEC 62304 software architecture and design description.

## Chris's decisions (2026-11-08)

- **Free-form text.** One page written like a normal document, not a form per section.
- **Somewhat strict tracing.** A whole sentence or paragraph with no requirement link is flagged,
  unless it is set as **standard** text (info, background, anything not required). Not every word
  has to be traced.
- **`@req` feeds an inbox** of text to turn into requirements. To start, only text in the
  document counts (not comments on checks).
- **The diagram is drawn from the outline only.** Hand-drawn layouts are evaluated later.
- **Top-level gists in Signoff PL.**

## The document

- Markdown-like text. Headings make the outline: `#` is level 1, `##` level 2, and so on down to
  drivers. The folding outline and the depth control come from them.
- **Depth 1 / 2 / 3:** headings only; headings and gists; full text.
- A section's **gist** is its first sentence, unless the section sets one (a `> gist:` line under the
  heading, or a field beside it; to decide when building).
- A heading can carry an optional **kind** for the diagram: `## Control loop · task`. Kinds: product,
  task, module, driver, hardware, interface. An untagged heading is in the outline but not the diagram.
- A heading can name what it **uses**, for the diagram's lines (syntax to decide; a picker beside the
  heading is the likely answer).

Example, from the demo thermostat (made up):

```
# Overview
The thermostat is a wall unit with a touch display that runs a home's heating and cooling.
{standard}It replaces a mechanical thermostat on the existing wiring.{/standard}

## Control loop · task
Every 1 s the [control loop reads the room temperature]{q:…} and switches the heat or cool
relay with 0.5 °C (0.9 °F) of hysteresis.

## Status LED · driver
The LED blinks at 1 Hz while a call for heat is active.
Make the LED pulse instead of blink @req
```

## What each piece of text can be

| State | How it looks | Where it shows |
| --- | --- | --- |
| **Linked** | faint solid outline; hover shows REQ chips; click opens the requirement | the requirement's *Described in* |
| **`@req`** | dashed outline and a small flag | **Requirements to make**, in the Requirements inbox |
| **Untraced** | plain text, a mark in the margin | the Untraced count and filter |
| **Standard** | plain text in a quieter style, no mark | nowhere |

States differ by line style and marks, never by hue alone (see `../CLAUDE.md`, colorblind-safe
severities). The unit of tracing is the sentence: a sentence is traced when any part of it is linked,
and a paragraph set as standard covers all its sentences.

In the example, the link shows as its requirement's ref (REQ-0xx), the LED's first sentence
is untraced, and the `{standard}` markup is a placeholder for whatever the editor
stores. Marking: select text, then **Link requirement…**, **Make requirement**, or **Standard**. Typing the
markup by hand works too.

## Both directions

- **Requirement to text.** A requirement no text links to shows under **Not described**, with
  **Describe in…**: pick a section, and a linked sentence with the requirement's text is added there,
  to be rewritten as prose.
- **Text to requirement.** An `@req` sentence shows in the inbox with who wrote it, when, and its
  section. **New requirement** makes a draft requirement (`status: 'draft'`) from the sentence, puts
  the section and date in its `source`, removes the tag, and links the sentence. If the section
  already links a requirement, the inbox also offers **Change REQ-0xx**, which opens that requirement
  with the new sentence beside it (most meeting notes change something that exists).
- `@req` matches the way `@revnotes` does in EE (`model.isRevNote`, `stripRevNote`): the same word
  boundaries, case-insensitive, with an optional colon.

## The diagram

Layers from the kinds, top to bottom: product, tasks, modules, drivers, hardware. One block per tagged
heading, lines from **uses**, and interface sections drawn as the lines' labels.

- Clicking a block opens its section; the outline and the diagram follow each other (the PL Map idea).
- A block with untraced text or undescribed requirements under it takes the suite's hatch
  (`--warn-hatch`), so thin parts of the firmware show at a glance.
- Because it is drawn from the outline, it can't go stale.

## Interfaces

An interface section holds an ICD (interface control document) table: one entry per message, with
direction, transport, rate, and version, and per field the name, type or size, units, scaling, range,
and meaning. Prose links to it ("the telemetry task writes [the status frame]{ICD:status-v2} at
5 Hz"). Machine-readable forms (AsyncAPI, .proto, XTCE, Kaitai Struct) can come later as exports.

## Data

Stored in the review document as `project.spec`:

```
spec: {
  sections: [ { id, title, level, kind, gist, body, uses: [ids], at, by } ],
  at, by
}
```

- The text is split into sections at headings when it is saved; the editor still shows one page.
- Links store the requirement's stable `id` (`q…`), and the page shows its `ref`, so renumbering a
  requirement never breaks a link: `[text]{q:abc123}`.
- Merge per section, newer wins (as `mergeMaps`), so two people editing different sections never
  overwrite each other. Edits to the same section on both sides keep a "(conflict copy)" section,
  as Loom does with harnesses.
- The summary gains `spec: { gists: [ { title, gist } ], untraced, undescribed, reqTags }` for the top
  level only. Readers cope when it is missing.

## Where the code goes

This is engine work: the tab is built in EE's `app.js` and `model.js` behind a config switch
(`config.spec`), synced into ME and FW, and turned on in FW only. FW never edits the engine (see
`CLAUDE.md`). Signoff PL shows the gists as "What it does" in a firmware Part's inspector, and the
gap counts beside them.

## Demo

The thermostat firmware (`fdemo3`) gets a short description: an overview, the control loop, the
telemetry task with a status-frame ICD, the touch and LED drivers, a few linked sentences, one
untraced sentence, one requirement not described, and one `@req` (the LED pulse note). This changes
the FW demo, so PL's snapshot is regenerated (`CLAUDE.md`, *Status*).

## Open questions

- How a section sets its own gist and its **uses** (inline syntax or fields beside the heading).
- Whether `@req` in check comments should feed the inbox later.
- Export to Markdown or PDF, and how much of IEC 62304's design description it should cover.
- Hand-drawn diagrams, after using the outline diagram for a while.

## The prototype (2026-11-08, branch `description`)

Built in the engine (EE `model.js`, `app.js`, `demo.js`, `styles.css`) and synced into ME and FW.
Each tool offers it with `"spec": { "label": "Scribe" }` in `config.js`, and a review picks it
in its details window beside Requirements and the checklists (`'spec'` in `meta.checklists`,
`model.specEnabled`; Chris, 2026-11-08). FW ticks it for new reviews (`"default": true`); EE leaves it off. ME doesn't offer it
(Chris, 2026-11-08: a part's design intent has no diagram worth drawing; revisit with ME input). A review from before the pick shows a description it already has; unpicked, the
description is kept but hidden, and left out of `summary.spec`. Served for review from the
`_desc/` worktrees (preview `signoff-desc`, port 8793): `fw_design_review/index.html?demo&project=fdemo3`.

- **Model** (`model.js`, *Scribe*): `project.spec` holds one record per heading section, merged
  newer-wins per section. Bodies use the markup in *The document*: `[text]{q:id}` links, `[text]{std}`
  standard text, `[text]{s:id}` pointers, `@req`, `Uses:`, `> gist`, lists, tables, and code. The
  editor shows refs and titles (`{REQ-004}`, `{#Status frame}`) and saves ids (`specToEditor`,
  `specFromEditor`). Sentences are split so a span is never cut and a span that ends a sentence ends it.
  A pointer to an interface section counts as traced. `summary.spec` carries the gists and gaps.
- **Tab:** an outline beside the document (headings, gists, or full text), the Requirements inbox (folded by default:
  *Requirements to make* and *Not described*), and a Diagram view. Clicking a sentence opens a panel: link or unlink a
  requirement, Make requirement (Edit REQ-0xx instead once it links one, which opens it in the Requirements tab), Change REQ-0xx (for a flagged note in a section that links one),
  Mark standard, Flag @req, Edit section. A requirement's panel has *Described in* (or Describe in…).
- **Editing:** a section at a time, as text in place (Ctrl+Enter saves, Esc cancels); new headings
  in the text become sections right after it, and emptying it deletes it. Add section and Paste text
  (a whole description, cut at headings) add at the end.
- **Edit all** (`specToText`, `specSaveAll`): the whole description as one text, its outline read
  live beside it, Save and Cancel stuck to the bottom of the screen. Saving keeps each section's id,
  so links to it survive: headings are matched in order by title, then a moved heading by its title,
  then a renamed one by its place between matched ones. A heading taken out deletes its section
  (Save asks first, naming them); only sections that changed are written.
- **Writing guide:** a button on both editors' bottom rows opens every mark the editor understands
  as "type this / what it does", with a short example; Back to writing returns to the draft. A
  heading's kind follows an asterisk, `## Control loop * task` (the editor writes it that way), or sits in
  brackets, `## Control loop (task)`; the middle dot still works.
- **Kind bar:** over both editors, the kinds left to right (Product › Task › Module › Driver ›
  Hardware › Interface, with counts), lighting the kind of the heading the cursor is under; a click
  sets it. *Add to Uses…* adds a section to that heading's Uses line.
- **Building in the diagram:** every layer is drawn, empty ones too, each with a + that adds a block
  (a new section: after the last of its kind, else under the block that uses it; *Used by* adds it to
  that block's Uses line). Clicking a block opens its panel: name (a rename follows into every Uses
  line), kind, gist (the `>` line), Uses (add from a list, remove with ×), Used by, Gaps (each untraced or flagged sentence; click to open it), Edit its text,
  Show in document, Add a <next layer> it uses, and Delete. Everything is written to the text
  (`specAddBlock`, `specSetLine`, `specRename`). Renaming a heading in either editor also renames it in
  Uses lines. An empty description can be built from the diagram (*Build it in the diagram*).
- **Drag to connect:** each block has a dot on its bottom edge (on hover, or always on touch
  screens). Dragging from it to another block adds that block to the first one's Uses line; the
  direction is from where the drag starts, whichever layer the target is in. Clicking a Uses line
  removes that name from the Uses line at once, with Undo in the message (2026-11-09; it used to ask,
  and the panel's × didn't).
- **Menus** (the engine's `menu()`) scroll when taller than the window and open upward when there's
  more room above.
- **Diagram:** layers by kind; lines from `Uses:`, else from the nearest section above it in the
  outline when nothing uses it; interfaces as dashed lines or pills; dotted blocks have gaps.
- **Signoff PL:** the reader keeps `summary.spec` (`CACHE_V` 6), and a Part's inspector shows
  *What it does*. The demo snapshot was regenerated.
- **Demo:** `fdemo3` has a 19-section description (engine demo `VERSION` 12): 7 linked, 12 standard,
  and 7 untraced sentences, REQ-005 not described, and two `@req` notes (the LED pulse, and a bootloader
  rollback note that offers Change REQ-001).
- **Tests:** EE 286 (74 new), ME 62, FW 66, PL 215, Loom pass.

- **Moving blocks:** drag a block's body (mouse or pen) to another layer to change its kind, or
  beside other blocks to move its section, with the sections under it, to that place in the outline at
  the neighbor's level (`specMoveBlock`). On touch screens, use the panel's Kind instead.
- **Phrase links:** select words inside one sentence, in the document or in the sentence panel, and
  the panel links just those (`specEdit` op `phrase`; *Whole sentence* goes back). Words that cross
  another mark can't be linked that way.
- **Conflict copies:** every section edit records the last five versions it was built on (`hist`,
  `specStamp`, `SPEC_HIST`).
  When two copies were edited from the same version, the merge (`mergeSpec`) keeps the newer and adds
  the other as "<title> (conflict copy)" right after it, with `conflictOf`; every merge of the same
  pair makes the same copy, once. The tab lists them under *Edited in two places* (Newer version, Edit
  copy, Delete copy). Sections from before `hist` merge newer-wins.
- **Requirements to make** is the list's name (Chris, 2026-11-13; it was "Write as requirements", and
  before that "To requirementify"), in the folded **Requirements inbox** with *Not described*. Each
  item says where it came from under its text: "Tagged @req in the description, in 3V3 buck, by Sam
  Patel, 7 d ago", or "Tagged @req in a comment from Sam Patel on <the check>, just now".
- **`@req` in comments:** a comment anywhere in the review flagged `@req` waits in *Requirements to
  make* with who wrote it and what it's on. New requirement makes a draft traced to the
  check it's on; on a requirement, Change marks it Changed. Each way, or Remove flag, the comment is
  marked handled (`reqDone`) and its words stay as written. Comment boxes hint at `@req`. The
  summary's `flagged` still counts the description's sentences only.
- **Export:** Markdown (`specMarkdown`: headings with their kind, links as "words [REQ-004]", a
  requirements table with where each is described) and a print view (Print or save as PDF), from
  Export in the tab.
- **Synced:** the engine is vendored into Fabcheck, Loom, and the hub's `suite.css` on their own
  `description` branches (`_desc/pcb_dfm`, `_desc/loom`, `_desc/signoff`). Loom's sync also wanted to
  copy newer Fabcheck parsers and `github.js` (drift on `main`, unrelated); those were left as they are.

## First real use (2026-11-09)

Three large descriptions (38–41 sections, 78–115 requirements, and 30–72 notes each) were written
through `specSaveAll` and read in FW's demo at about 800 × 600. Branch `scribe-fixes` fixes what that
turned up (engine in EE, synced to ME and FW, vendored to PL, Fabcheck, and Loom):

- **Marks are scanned, not matched** (`specSpans`, `specSpanReplace` in `model.js`). A mark's words
  may hold balanced brackets (`[It reads buf[0] first.]{std}`) and `` `code` ``, whose brackets and
  braces never count; a backtick pair outside a mark is code too, so `` `cfg[i]{0}` `` is never a mark.
  Every reader of marks uses the scanner (sentences, units, edits, the editor's refs, Markdown, and
  `specPlain`).
- **A mark that doesn't parse is flagged**, not silently untraced: "]{" left outside marks and code
  makes the sentence `broken`. It shows a wavy underline and a hatched *mark?* badge, its panel says
  why, and the panel's buttons and Make requirement leave it alone (wrapping it would make another).
  Both editors list such lines under the text as you type (`specBrokenMarks`), each with a button that
  puts the cursor there; saving says how many are flagged.
- **Sentence splitting** (`specStopEnds`): a mark whose words end a sentence ends it, whatever comes
  next; a sentence may start with a lowercase identifier (`kff is added …`). Strong abbreviations (e.g.,
  i.e., vs., cf., viz., approx., incl.) never end one. Weak ones (No., Fig., rev., ref., V., min., max.,
  etc., …) and dotted initials (a.k.a.) hold only before a lowercase word or a number, and rev., ref.,
  No., and Fig. also before a single capital or a ref (`rev. B`, `ref. REQ-004`). So `above 22 V. The
  pump` splits. A question or exclamation mark ends one only before a capital, since one inside a quoted
  string runs on (`("RELAY ON!") when …`). A note glued to a linked sentence
  is its own sentence once the sentence before it ends with a full stop; the writing guide says so in
  *Marks and sentences*.
- **`specPlain`** drops a space before punctuation only where the punctuation ends a word, so "the
  .cfg file" keeps its space.
- **Long sections**: a review keeps up to 100,000 characters per section (`SPEC_BODY_MAX`, was 40,000,
  cut silently). The editors, Paste text, and Start from template refuse to save a longer one and name
  it (`specTooLong`); the editor warns while you type. Renames that rewrite other sections' Uses lines
  start from the stored body (`specRawBody`), never the cut copy.
- **The summary's gists** (`summary.spec`): a heading with nothing written under it (a group such as
  Interfaces) is left out, up to 40 are kept (`SPEC_GISTS`, was 12, cut with no marker), and `more`
  counts the rest. PL's reader keeps 40 and `more` (`CACHE_V` 9) and shows "and N more sections in the
  review". The FW demo's summary lost its three empty groups; PL's snapshot was regenerated.
- **Kind labels** (`specKindLabel`, `specKindPlural`): `config.spec.kinds` may give `label` and
  `plural`; without them, the id capitalized, and hardware, software, firmware, and power have no
  plural. The layer said "HARDWARES".
- **The layered diagram** wraps a crowded layer onto more lines (blocks stay at least 150 wide) and
  breaks a long name onto two lines; dragging between layers reads each layer's band (`data-bands`) and
  places a block in reading order. Names were cut to 4–7 characters at 9–12 blocks in a row.
- **Removing a link** from a diagram line or the block panel's × happens at once, with Undo in the
  message (`toast` takes an action). One writer lost a link to a single click.
- **Jumps** (outline, Requirements to make) check where they landed once the smooth scroll ends and
  correct it (`specScrollTo`). Switching Document and Diagram closes the other view's panel: on a
  narrow screen a block's panel is a sheet over the depth buttons, which is the likeliest reason a
  depth click seemed ignored (not reproduced).
- **Wide tables** scroll sideways inside their card at every width (the Requirements card had
  `overflow:hidden` above 860 px, so its right columns clipped beside the sidebar), with a shade on the
  edge that has more. A table in the text scrolls inside itself (70% of the window high) with its header
  row pinned, so its sideways scrollbar is on screen; its columns keep a readable width.

Tests: EE 356 (34 new), ME 62, FW 70, PL 239 (1 new), Loom 26; the command line's 34 in each of EE,
ME, and FW. The FW and EE demos parse the same under the new rules (checked unit by unit), and every
guide step still finds its target. The three real descriptions were checked the same way, locally:
every sentence keeps its place and state, Edit all round-trips each with nothing to write, and none
has a mark that doesn't parse (their writers had worked around these bugs). Their next sync changes only
`summary.spec`: an empty Hardware and Interfaces drop out of one, and two more gists reach PL in another.

Not covered: an unbalanced bracket inside a mark (`[range [0, 100) is valid]{std}`) still parses from
the inner bracket, unflagged (the sentence keeps its state; only the mark's extent is short). The
jump correction couldn't be watched, since smooth scrolling doesn't run in a hidden preview pane.

### Decisions on first use (Chris, 2026-11-09)

Asked with the options below (the recommendation first in each). Chris chose: **A** the `Check:` prefix
(no data move); **B** Unlinked; **C** requirements verified on the ring; **D** keep joining lines, with a
`Check:` line starting its own paragraph; **E** both, highlight and bundled lines; **F** always a block;
**G** all four; **empty groups** list the sections under them.

- **A. Review notes.** Doubts were written as untraced sentences starting `Check:`, so they share the
  Untraced count, filter, and the diagram's gap hatch with sentences nobody has linked yet. (1) A
  sentence or list item starting `Check:` is a review note: counted and filtered on its own, its own
  margin mark (a line style, not a hue), not a diagram gap, and *Resolve* in its panel removes it, with
  Undo. The three real descriptions need no change. (2) A mark, `[…]{check}`, with the same behavior;
  the real descriptions' notes move to it later (a data change, with Chris's OK). (3) Both.
- **B. Wording.** Scribe's "untraced" (a sentence with no requirement) sits beside the Requirements
  tab's "Not traced" (a requirement with no check). (1) Scribe says **Unlinked**, the opposite of
  Linked; data keys stay. (2) The Requirements tab says "No checks" instead. (3) Keep both.
- **C. The Overview ring** reads "100% reviewed, 0 to review" for a review with only Requirements and
  Scribe, every requirement unverified. (1) With no checks, the ring shows requirements verified ("0 of
  5 verified"); PL's roll-up keeps 100% (Chris, 2026-11-09). (2) Keep 100% and say "No checks to
  review". (3) Keep.
- **D. Single newlines** join lines into one paragraph. (1) Keep (hard-wrapped text reads right); the
  writing guide says so, and a `Check:` line (A) starts its own paragraph. (2) Keep line breaks as typed.
- **E. Fan-outs** (one block using 7–12 others). (1) Hovering or selecting a block brings its lines
  forward and fades the rest. (2) Bundle lines into one trunk that splits near the targets. (3) Both.
- **F. Interfaces** are a pill on the line when two blocks use them, but a block in the Interfaces row
  when one does. (1) Always a block in the Interfaces row, with lines to its users. (2) Always a pill,
  with a stub line for one user. (3) Keep, with pills that wrap instead of cutting the name.
- **G. Smaller wishes**, any of: ranges `{REQ-044..REQ-063}`, expanded on save; `\|` in a table cell;
  links in table rows (an ICD row tracing a requirement); Uses names with brackets or commas (in FW,
  brackets stay part of the name; a comma needs quotes).
- **Empty groups in PL** (raised by the summary fix): a heading with only headings under it ("##
  Interfaces") has no gist, so PL doesn't show it. (1) Its gist lists the sections under it ("Status
  frame, Debug port"). (2) Leave it out; write a `>` line to show it. (3) Keep the title with no gist.

### What was built from the decisions (2026-11-09, branch `scribe-fixes`)

- **A. Review notes.** A sentence or list item whose words start `Check:` (any case) is a `note`
  (`SPEC_NOTE` in `model.js`): its own state after `@req` (a flagged note stays in the inbox), counted
  in `counts.note` and `totals.note`, listed on each section as `notes`, never a gap, never the gist, and
  a link inside it doesn't describe its requirement. On screen: a boxed CHECK label (a double border,
  not a hue), a quieter sentence, a ringed count beside the gap count in the outline and on headings,
  "N review notes" in the header, a *Review notes* list in a block's panel, and "N notes" on a block
  with no gaps. The sentence panel has **Resolve**, which takes the note out (`specRemoveUnit`: its line
  when it has one to itself, else the sentence and its space), with Undo. **Gaps** and **Notes** beside
  the depth buttons show only the sections that have them, with the other sentences dimmed (opacity).
  The choice is kept; a jump to a hidden section or sentence (Show in document, a Uses chip, the inbox,
  Described in) turns it off, the guide always does, and the control stays while it's on.
  `summary.spec.notes` counts them for PL ("N review notes"; reader `CACHE_V` 10). The three real
  descriptions' untraced sentences were all `Check:` notes, so they become notes as they are.
- **B.** Untraced reads **Unlinked** everywhere on screen (sentence panel, header, gap list, diagram
  note, guide, writing guide, PL). Data keys stay `untraced`.
- **C.** A review with no checks shows its requirements on the Overview: the ring is the share verified,
  "requirements verified", and the four counts are Verified, Failing, Not verified, and Requirements,
  each opening the Requirements tab. The sidebar's ring, `pct`, and the summary stay 100%.
- **D.** Single newlines still join; a line that starts `Check:` starts its own paragraph.
- **E.** In the layered diagram, lines from one block to three or more on one line below share a trunk
  to a split point just above them and fan out there (a click on the fan-out removes that link, never
  the trunk). Pointing at a block brings its own lines forward (thicker) and fades the rest, in both the
  layered and EE's flow diagram; a selected block keeps that in the layered diagram. EE's flow diagram
  isn't bundled.
- **F.** Every interface is a block in the Interfaces layer, with dashed lines to the blocks that use
  it; there are no pills.
- **G.** `{REQ-044..REQ-063}` (or `..063`, or an en dash) is written out on save as every requirement
  in that run that exists (`specRange`; none existing leaves it as typed, shown not found). `\|` is a bar
  inside a cell (`specCells`). A table row with a mark is a unit, counted like a sentence and listed in
  *Described in*; it draws with its marks and opens its panel, and edits keep its cells (never wrapped
  or flagged; a link goes into its mark). Uses names: brackets at the end are still a detail ("MCU
  (flash)" is the MCU, as a real description used them), but a heading whose title has the brackets
  ("Sensor (ADC)") is matched first (`specUseId`, `specUseIs`), and quotes hold commas or brackets; the
  editors write such names in quotes. Renames follow both kinds.
- **Empty groups.** A heading with only headings under it gets the titles of the ones directly under it
  as its gist in `summary.spec`; one with nothing under it at all is left out.

Tests: EE 380, ME 62, FW 70, PL 240, Loom 26; command line 34 in each of EE, ME, and FW. On the three
real descriptions (locally): only untraced → note changes, Uses links and *Not described* are the same,
and Edit all round-trips each. At their next sync their `summary.spec` gains `notes`, `untraced` drops
to 0, and empty groups list their sections.

## Signoff EE

EE uses the same tab as a schematic block diagram: subcircuit kinds, Connects and Supplies with
signal and rail names, Parts, and a left-to-right flow layout with power along the top. Kinds, link
words, and the layout are config (`config.spec`), and FW's defaults are what this doc describes. See
`ee_design_review/docs/scribe-ee.md`.

## The guide (2026-11-08)

`assets/specguide.js` (an engine file, `window.SignoffSpecGuide`), after Loom's guide
(`loom/assets/guide.js`): a card with 23 steps in six chapters (Welcome, Tied to requirements,
Writing, The diagram, Sharing, Done), each a title, what the feature is, a *Try it* task, a `setup`,
and a `spot` ringed every frame (`#sg-guide-spot`). Back, Next, Contents, and a draggable top line,
as in Loom; `{Edit all}` in a step's text is a button chip and `{k:Esc}` a key. The visitor makes a
requirement from the hysteresis sentence, links a phrase, clears the inbox, describes REQ-005, edits
a section, sets a kind, adds to Uses, renames a heading in Edit all, adds a Scheduler block from the
diagram, writes its text and its requirement, connects and moves it, and uses the block panel.

- **Where it runs.** Only on the demo review named by `config.spec.guide` (a demo seed; FW sets 3,
  the thermostat firmware). The tab's Guide button and the Writing guide's *Take the guide* show only
  there. Started from a real review it reopens `?demo&project=fdemo3&guide`, and its last step offers
  Back to my reviews. If the visitor changed the demo firmware, Start asks before rebuilding it from
  the demo (`Signoff.app.spec.stale` and `fresh`); with Cancel the steps fall back where they can.
- **How it drives the page.** Through `Signoff.app.spec` in `app.js` (`open`, `unit`, `block`,
  `edit`, `editAll`, `req`, `section`, `newest`, `goto`), not clicks, since the page is redrawn with
  innerHTML. A block the visitor added is found as the newest section without a fixed demo id.
- **The card** takes the corner of the page covering least: never the ring if it can help it, and
  not the details pane or the editor. On a narrow screen it docks at the top. It re-places itself when
  the pane opens or settles, an editor or sheet appears, or the ring moves. The hub's tour hides while
  it runs (`body.sg-guide-on`). State is sessionStorage `signoff.specGuide`.
- **Keep it current.** When a feature a step describes changes, update the step. A quick check: run
  `SignoffSpecGuide.go(i)` for each step in a laid-out tab and look that `SignoffSpecGuide.target()`
  finds something (steps 22 and 23 ring nothing).

Not done yet: Partcheck's `me-send` branch isn't synced;
how much of IEC 62304's design description the export should cover. Nothing has been tried with a real
token.

## The template (2026-11-08)

Chris: a new firmware review's description should start with default sections, chosen by the
firmware profile, the way the thermostat demo is laid out. `config.spec.template` (FW's `config.js`)
is a list of entries `{ when: [tags], unless: [tags], lines: [...] }`: an entry is used when it has no
`when` or the profile has one of them, and none of its `unless`. `{name}` is the review's name. The
engine's `model.specTemplate(project)` joins the chosen entries, keeps only the names in each Uses
line that made it in, and drops a group heading (Drivers, Interfaces) with nothing under it.

- The layout follows the demo: the product, Software structure (RTOS tasks, a main loop for bare
  metal, or a question when neither is picked) with its tasks, Fault handling and the other modules,
  Drivers, Bootloader, Hardware, and Interfaces with an ICD table. Medical adds IEC 62304's safety
  classification, Risk controls (also Functional safety), and SOUP; Volume production adds
  Manufacturing. Every section holds a question to answer in its place, so it counts as untraced
  until it's written.
- A new review with Scribe ticked starts from it. An empty description offers **Start from
  template**, which shows the text (editable) before adding it. Nothing overwrites a description.
- Kinds use `* kind`, so the diagram draws from the first save.
- Tests: EE checks the pruning; FW applies the template for each of the 18 tags alone, none, and all,
  and checks every Uses name resolves.

## Document tab: header, add below, drag, back and forward (Chris, 2026-11-09)

All in the engine's `app.js` and `styles.css`, so EE, ME, and FW share it.

- **Header.** One row, level with the title: back and forward, *Edit all*, *Add section*, and a menu
  (☰, `spec-more`) holding the Guide, the Writing guide, *Paste text…*, and both exports. The guide's
  Export step rings the menu.
- **+ on a heading** (`spec-add-after`, beside the pencil) opens the editor right under that section.
  The new section takes the level of what follows when that's a subsection (so it becomes the first
  subsection), else the heading's own level; `specNewAt` places its order between the two.
- **Drag a section** by its heading in the text or its name in the outline (pointer events, not HTML
  drag and drop; mouse and pen only). It moves with its subsections through `model.specMoveBlock`. The
  line shows the landing place: before the section under the pointer, at its level; in the gap after a
  subsection, toward the right keeps it a subsection there. The scroller (`.main`, or the outline when it
  scrolls) moves while the pointer is within 64 px of its visible top or bottom edge or past it, up to
  about 40 px per frame, scaled by frame time. Esc cancels; a drop where it was writes nothing.
- **Back and forward** (`specHists`, `specHistNote` from `touch`, `specHistStep`; Ctrl+Z, Ctrl+Shift+Z,
  Ctrl+Y). Every Scribe edit in the open page is a step: sentence buttons, section saves, moves, adds,
  deletes, and the diagram. Undoing writes the earlier record as a new edit stamped now, chained after
  the current one (`hist`), so auto-sync carries on and a merge sees a plain newer edit. A step is
  refused when its sections changed since (a sync brought someone's newer edit), so it never overwrites
  that. The toast after a step names it ("Undone: the change to Bootloader") and the section flashes.
  Records count as this page's edit only when stamped by this user within 10 s; anything else that
  changed came in from a sync and is only noted. The history lives while the page is open.

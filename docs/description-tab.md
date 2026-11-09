# Signoff FW: a Description tab (design)

2026-11-08. Status: a working prototype on branch `description` (EE, ME, FW, and PL), not merged.
The tab is called **Description** (Chris, 2026-11-08; he first called it "Plain Text Requirements"). *The prototype* below says what was built and where it differs from this design.

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
| **`@req`** | dashed outline and a small flag | the **To requirementify** inbox |
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
Each tool offers it with `"spec": { "label": "Description" }` in `config.js`, and a review picks it
in its details window beside Requirements and the checklists (`'spec'` in `meta.checklists`,
`model.specEnabled`; Chris, 2026-11-08). FW ticks it for new reviews (`"default": true`); EE and ME
leave it off. A review from before the pick shows a description it already has; unpicked, the
description is kept but hidden, and left out of `summary.spec`. Served for review from the
`_desc/` worktrees (preview `signoff-desc`, port 8793): `fw_design_review/index.html?demo&project=fdemo3`.

- **Model** (`model.js`, *Description*): `project.spec` holds one record per heading section, merged
  newer-wins per section. Bodies use the markup in *The document*: `[text]{q:id}` links, `[text]{std}`
  standard text, `[text]{s:id}` pointers, `@req`, `Uses:`, `> gist`, lists, tables, and code. The
  editor shows refs and titles (`{REQ-004}`, `{#Status frame}`) and saves ids (`specToEditor`,
  `specFromEditor`). Sentences are split so a span is never cut and a span that ends a sentence ends it.
  A pointer to an interface section counts as traced. `summary.spec` carries the gists and gaps.
- **Tab:** an outline beside the document (headings, gists, or full text), the *To requirementify*
  and *Not described* lists, and a Diagram view. Clicking a sentence opens a panel: link or unlink a
  requirement, Make requirement, Change REQ-0xx (for a flagged note in a section that links one),
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
  line), kind, gist (the `>` line), Uses (add from a list, remove with ×), Used by, Write its text,
  Read it, Add a <next layer> it uses, and Delete. Everything is written to the text
  (`specAddBlock`, `specSetLine`, `specRename`). Renaming a heading in either editor also renames it in
  Uses lines. An empty description can be built from the diagram (*Build it in the diagram*).
- **Drag to connect:** each block has a dot on its bottom edge (on hover, or always on touch
  screens). Dragging from it to another block adds that block to the first one's Uses line; the
  direction is from where the drag starts, whichever layer the target is in. Clicking a Uses line
  asks, then removes that name from the Uses line.
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
- **`@req` in comments:** a comment anywhere in the review flagged `@req` waits in *To
  requirementify* with who wrote it and what it's on. New requirement makes a draft traced to the
  check it's on; on a requirement, Change marks it Changed. Each way, or Remove flag, the comment is
  marked handled (`reqDone`) and its words stay as written. Comment boxes hint at `@req`. The
  summary's `flagged` still counts the description's sentences only.
- **Export:** Markdown (`specMarkdown`: headings with their kind, links as "words [REQ-004]", a
  requirements table with where each is described) and a print view (Print or save as PDF), from
  Export in the tab.
- **Synced:** the engine is vendored into Fabcheck, Loom, and the hub's `suite.css` on their own
  `description` branches (`_desc/pcb_dfm`, `_desc/loom`, `_desc/signoff`). Loom's sync also wanted to
  copy newer Fabcheck parsers and `github.js` (drift on `main`, unrelated); those were left as they are.

Not done yet: Partcheck's `me-send` branch isn't synced;
how much of IEC 62304's design description the export should cover. Nothing has been tried with a real
token.

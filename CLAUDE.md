# Signoff FW (fw_design_review): notes for Claude

Signoff FW is the firmware design review tool, a prototype started 2026-11-02. It runs the
**same engine as Signoff EE**, copied byte for byte from `../ee_design_review`, exactly as Signoff
ME does. Also read `../CLAUDE.md`. The repo is meant to be public: no client data, tokens or
commit messages naming clients.

## Status

- Local git repo only (`main`, nothing committed). There's no GitHub repo, data repo or Pages
  site yet. Ask Chris before creating them.
- The hub, EE, ME and PL don't link to it yet. See *Suite follow-ups* in `docs/audit.md`.

## Rules

- **Never edit the engine files here.** These are `assets/model.js`, `github.js`,
  `workspace.js`, `app.js`, `demo.js`, `styles.css` and `tools/build.py`, `package.py`,
  `validate_templates.py`. Fix them in EE, then run `python tools/sync_engine.py` here.
  `build.py` fails while the copies differ. After an engine change in EE, sync here too.
- **What belongs to FW:**
  - `assets/config.js`: names, repos, the `review-fw-` prefix, 18 profile tags, stages, demo data
  - `index.html` (title, brand, "Targets" and the suite links are hard-coded)
  - `templates/`: check-ID prefixes per checklist are in `templatePrefixes`
  - `tests/`
  - the docs
- **Words.** One FW review is a **target** (one firmware image). The thing reviewed is
  "firmware" (`words.thing`).
- **Check IDs** are never renumbered or reused. Don't name a checklist `fab` (the demo builder
  keeps that id for Fabcheck).
- **The demo** is the Smart Thermostat's firmware (`fdemo3`). It matches PL's demo, which has a
  "Thermostat firmware" Part and the OTA and touch-ESD requirements. Demo users are
  Jordan Brooks and Ari Chen, with Sam Patel (the EE demo's lead) reviewing.
  - The shared demo builder spaces findings 0.07 of the review period apart, so a demo project
    can hold at most 9 findings before they land in the future. A test catches it.
  - The tests also check that every demo comment and requirement link survives. The builder
    silently drops ones whose check is outside the profile or the project's checklists.

## Before committing

1. Run `python tools/sync_engine.py --check`, then `python tools/build.py`.
2. Open `tests/test.html` over http. It should show PASS (66 tests as of 2026-11-02).
3. Grep the diff for client names, using the pattern in `../CLAUDE.md` (*Hard rules*).

# Signoff FW: first checklists and what to build next

2026-11-02. This covers how the prototype's checks were chosen, what Signoff FW still lacks for
firmware work, and the suite changes left for later.

## What the prototype is

Signoff FW is a third copy of the shared Signoff engine, set up the way Signoff ME is: no
engine changes, everything firmware-specific in `assets/config.js`, `templates/`,
`index.html`, the tests, and the docs. So it already has everything EE and ME have:
- checklists with profile tags
- findings with severity, owner, and resolution
- comment threads and the requirements tab with traceability
- the review report and CSV
- GitHub sync, People & access, contractor zips
- the project summary that Signoff PL reads

## The initial checks (196 in 11 checklists)

The checklists follow the order a firmware review usually goes in: what it must do, how it
meets the hardware, how it runs, how it talks, how it's protected and updated, and how it's
proven and shipped.

| Checklist | Checks | What it's there for |
| --- | --- | --- |
| Requirements & Architecture | 23 | Quantified timing and fault behavior; resource budgets; third-party code and licenses; functional safety (tagged) |
| Hardware Interface | 33 | The EE/FW seam: pinmux against the schematic, safe output states through reset, clocks, errata, bus recovery; sensing, outputs, display, and touch (tagged) |
| Startup, Memory & Faults | 21 | Reset cause, linker and map review, stack measurement and overflow detection, power-safe storage, watchdog design, fault capture, reset-loop limits |
| RTOS, Interrupts & Concurrency | 16 | ISR priorities and length, worst-case response, shared data, priority inversion, queue overflow |
| Power Management | 12 | Energy budget, sleep and wake sources, battery charging and shutdown (tagged); power-loss recovery for everyone |
| Communications | 19 | Protocol docs, malformed input, timeouts; radio certification settings and test modes, reconnect backoff, offline behavior; TLS and API versioning; USB IDs |
| Security | 18 | Debug lock, secure boot, anti-rollback, no secrets in source, per-device credentials, input validation and fuzzing, CVEs, EN 18031 / CRA / Cyber Trust Mark |
| Bootloader & Updates | 13 | Bootloader validation and handoff, A/B or recovery image, confirm-or-rollback, signed images, staged rollout, settings migration |
| Code Quality | 11 | Coding standard, warning-free builds, static analysis in CI, code review, arithmetic and undefined behavior |
| Testing & Verification | 14 | Host unit tests, HIL, requirement-based tests, soak and fault injection, behavior during EMC and ESD tests, timer wrap |
| Build, Release & Production | 16 | Reproducible CI builds, embedded version and git hash, archived ELF and map, factory programming, end-of-line locking, provisioning, SBOM, signing-key custody |

How the checks were picked:
- **The most expensive field failures first.** Bricked devices from failed updates, outputs that
  pulse during boot, watchdogs that can't catch a hung task, settings lost on a power cut,
  unlocked debug ports, and shared secrets. Those are the critical items.
- **The EE/FW seam.** Hardware Interface leans on things only a firmware engineer checks against
  the schematic (pinmux, reset states, errata), so it pairs with Signoff EE's schematic and
  bring-up checklists.
- **Current compliance.** EU radio products now need EN 18031 (RED cybersecurity). The Cyber
  Resilience Act's vulnerability reporting duties have applied since September 2026, and the rest
  of it applies from December 2027. These sit in Security and are
  tagged, so they appear only for connected products.
- **Usable on any project.** 117 of the 196 checks (60%) are untagged. Safety, medical, battery,
  motor control, and the other domain checks appear only when the profile says so.

Not covered yet, and worth adding once Chris and the FW engineers have used it:
- embedded Linux (Yocto/Buildroot, kernel config, rootfs updates). There's no `embedded-linux`
  tag yet.
- automotive (ISO 26262, AUTOSAR)
- deeper DSP and audio
- graphics frameworks
- BLE and Matter specifics
- cellular carrier certification

**Ask a firmware engineer to review the checks before using them on a client project.** They
were written from general practice, not from Dovetail's own lessons learned. The EE and ME
checklists started from Dovetail's old review sheets; FW has none yet.

## Firmware features the engine doesn't have yet

In rough order of value. Each would be an EE engine change (and so reach ME too) or a separate
checker, like Fabcheck is for EE.

1. **Build linkage.** Let a review record the git commit and the CI build it reviewed. Findings
   could then cite a file and line at that commit and open it on GitHub. This is the firmware
   counterpart of Fabcheck's stored runs. Today `revision` is free text.
2. **A firmware checker ("Fabcheck for firmware").** A browser tool, like Fabcheck, that takes a
   build's ELF and map file. It would:
   - check flash and RAM use against the budget, per section and per module;
   - track growth since the last review;
   - find the largest symbols, and stack use where the compiler's `.su` files are included;
   - check the image header, version, and hash;
   - check the vector table and the linker regions against a partition plan.

   Send to Signoff would raise issues on Startup, Memory & Faults, as Fabcheck does on EE's Fab
   checklist. The map file and the ELF need no client cooperation, so this is the most
   achievable checker.
3. **Static analysis import.** Read SARIF (cppcheck, clang-tidy, GCC's `-fanalyzer`, and most
   commercial tools emit it) and raise grouped issues against Code Quality and Security, with a
   baseline, so only new findings show up.
4. **SBOM and CVE view.** Read a CycloneDX or SPDX SBOM, list the components and licenses, and
   flag known vulnerabilities. This would also feed Signoff PL's BOM, as the firmware Part's
   contents.
5. **Pin cross-check with Signoff EE.** Compare the firmware's pinmux (for example the
   STM32CubeMX `.ioc` or a Zephyr devicetree) with the netlist Fabcheck already parses. It would
   flag pins whose function doesn't match the net name. This would reach the "pin assignments
   match the schematic" check automatically.
6. **Test results.** Import JUnit XML from CI and attach the results to the requirements they
   verify, so a requirement's evidence is a test run rather than a sentence.
7. **Release gate.** A per-release view (version, the checks done, open issues, the SBOM, the
   archived ELF) for PL's Phase 3 gates.

## Suite follow-ups

Done on 2026-11-02:
- [x] Repos `fw_design_review` (public) and `fw_design_review_data` (private) created.
- [x] The hub has a Signoff FW tile, panel, About section, and sidebar link.
- [x] EE, ME, and PL sidebars link to Signoff FW. EE's and ME's `repos.suite` include the FW
      repos, so Add FTE invites people to them.
- [x] Signoff PL lists FW in `tools`. Its demo's firmware Part links to `fw:fdemo3`, and the OTA
      and ESD System requirements flow down to FW's REQ-001 and REQ-002 (the PL-held firmware
      requirements are gone). PL's snapshot includes the FW demo.
- [x] The root `CLAUDE.md` lists FW as a `sync_engine.py` copy.

Still open:
- [ ] Turn on GitHub Pages for `fw_design_review` (Chris; the token can't).
- [ ] Fabcheck and Partcheck don't link to FW. They link only to the review tool they feed (EE,
      ME), which still seems right.
- [ ] The engine's comments say "EE and ME". Update them to include FW the next time the engine
      changes for other reasons.
- [ ] Write `docs/guide.md` (the user guide) once the checks are reviewed.

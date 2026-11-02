# Checklist templates

Each checklist is one JSON file in `templates/`. `tools/build.py` bundles them into
`assets/templates.js` so the tool works when opened from disk. After a Git Sync, the
templates pulled from the repo are used instead of the bundled copy.

## Shape

```json
{
  "id": "boot-memory",
  "title": "Startup, Memory & Faults",
  "short": "Memory & faults",
  "version": 1,
  "description": "One sentence on what this checklist covers.",
  "sections": [
    {
      "id": "mem-map",
      "title": "Memory & Linker",
      "tags": [],
      "items": [
        {
          "id": "mem-map-3",
          "text": "Stack sizes are measured at worst case, with margin",
          "hint": "How to check it, or why it matters. One to three sentences.",
          "tags": [],
          "severity": "major"
        }
      ]
    }
  ]
}
```

- `id` (template, section, item): lowercase letters, digits and `-`. Unique across **all**
  templates. Never reuse or renumber an ID: reviews store their state by item ID.
  If an item is removed, its ID is retired; reviews keep its state and show it as retired.
- Each checklist owns an ID prefix, and its section and item IDs start with it:

  | Checklist (`id`) | Prefix | Section IDs | Item IDs |
  | --- | --- | --- | --- |
  | Requirements & Architecture (`requirements`) | `req` | `req-<sec>` | `req-<sec>-<n>` |
  | Hardware Interface (`hw-interface`) | `hsi` | `hsi-<sec>` | `hsi-<sec>-<n>` |
  | Startup, Memory & Faults (`boot-memory`) | `mem` | `mem-<sec>` | `mem-<sec>-<n>` |
  | RTOS, Interrupts & Concurrency (`concurrency`) | `rtos` | `rtos-<sec>` | `rtos-<sec>-<n>` |
  | Power Management (`power`) | `pwr` | `pwr-<sec>` | `pwr-<sec>-<n>` |
  | Communications (`comms`) | `com` | `com-<sec>` | `com-<sec>-<n>` |
  | Security (`security`) | `sec` | `sec-<sec>` | `sec-<sec>-<n>` |
  | Bootloader & Updates (`update`) | `ota` | `ota-<sec>` | `ota-<sec>-<n>` |
  | Code Quality (`quality`) | `cq` | `cq-<sec>` | `cq-<sec>-<n>` |
  | Testing & Verification (`test`) | `tst` | `tst-<sec>` | `tst-<sec>-<n>` |
  | Build, Release & Production (`release`) | `rel` | `rel-<sec>` | `rel-<sec>-<n>` |

  `<sec>` is a short code (2–6 letters) for the section, e.g. `mem-map` for memory and linker.
  `<n>` counts from 1 within the section. `tools/validate_templates.py` enforces the prefix.
- Don't name a checklist `fab`: the shared demo builder treats that id as Fabcheck's.
- `text`: the check, phrased as the condition that should be true. Required.
- `hint`: optional guidance. Say how to check it or what goes wrong if missed.
- `severity`: `critical` (unsafe outputs, a bricked or exploitable device, data loss across the
  fleet), `major` (likely field failure, a missed requirement, a certification problem), or
  `minor` (maintainability, documentation, diagnostics).
- `tags`: when the item applies. An untagged item applies to all firmware. A tagged item
  (or section) applies only when the target's profile has **at least one** of its tags. An
  item in a tagged section needs both its own tags and the section's to match, so a section
  that holds items for two tags lists both.
- Bump `version` when the content of a template changes.

## Tags

Use only these. `tools/validate_templates.py` rejects anything else (the list lives in
`assets/config.js`).

| Tag | Applies when the firmware has… |
| --- | --- |
| `bare-metal` | Bare metal: Superloop or event loop, no RTOS |
| `rtos` | RTOS: FreeRTOS, Zephyr, ThreadX and similar |
| `multi-core` | Multiple processors: Co-processor, radio SoC, dual core |
| `wireless` | Wireless: Wi-Fi, BLE, Thread, LoRa, cellular |
| `cloud` | Cloud connected: Backend, MQTT / HTTPS, device fleet |
| `ota` | Field updates: Over the air or field-updatable images |
| `usb` | USB: USB device or host |
| `battery` | Battery: Battery powered, charging, fuel gauge |
| `low-power` | Low power: Sleep modes, energy budget |
| `display-ui` | Display / UI: Display, touch, GUI |
| `sensing` | Sensing: ADC, sensors, filtering, calibration |
| `actuators` | Outputs: Relays, heaters, valves, solenoids |
| `motor-control` | Motor control: PWM, closed loop, power stages |
| `storage` | Storage: External flash, file system, logging |
| `security-sensitive` | Security sensitive: Secure boot, keys, privacy |
| `safety` | Functional safety: IEC 60730 class B, IEC 61508 |
| `medical` | Medical: IEC 62304 software |
| `high-volume` | Volume production: Factory programming, provisioning |

## Writing guidance

- Metric first, with imperial in parentheses only where the industry quotes it.
- Don't invent standard clause numbers or precise thresholds. Name a standard only when
  you're sure it's the right one (MISRA C, CERT C, IEC 60730, IEC 61508, IEC 62304, EN 18031,
  ETSI EN 303 645 are fine), and label rules of thumb as such ("keep at least 25% margin").
- One check per item. Avoid "and also…" items that can half pass.
- Make checks something a reviewer can verify in the code, the map file, a trace capture, a
  test report or on the bench, and say how in the hint.
- American English spelling throughout (behavior, initialize, analyze, color).

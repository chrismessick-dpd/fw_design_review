/* Signoff FW: everything that differs between the Signoff tools (EE, ME, FW). The shared engine
   (model.js, github.js, workspace.js, app.js, demo.js, styles.css and tools/*.py, vendored
   from ee_design_review by tools/sync_engine.py) reads this. Keep the part after "=" strict
   JSON: tools/build.py, validate_templates.py and package.py parse it too.

   storage.ns:     localStorage namespace for this tool. The GitHub token (signoff.token) and
                   the theme (signoff.v1.settings -> theme) are shared by every Signoff tool.
   repos:          defaults for Settings -> Repositories. prefix must not be a prefix of
                   another tool's (contractors find their repos by name prefix).
   repos.suite:    other repositories every FTE is invited to, next to this tool's own:
                   the other disciplines' tool and data repos, and the hub.
   ids:            prefixes for new project, comment and custom-check IDs.
   templatePrefixes: checklist id -> required prefix of its section and item IDs.
   words.unit(s):  what one review is called on screen (target: one firmware image, such as
                   the main MCU application or a co-processor's). "Project" is the client
                   project several reviews belong to (meta.project).
   Don't name a checklist "fab": the demo builder treats that id as Fabcheck's. */
window.SIGNOFF_CONFIG = {
  "product": "Signoff FW",
  "discipline": "FW",
  "tagline": "Firmware design review",
  "storage": { "ns": "signoff-fw.v1.", "demoNs": "signoff-fw.demo." },
  "hostedBase": "https://chrismessick-dpd.github.io",
  "repos": {
    "owner": "chrismessick-dpd",
    "toolRepo": "fw_design_review",
    "dataRepo": "fw_design_review_data",
    "prefix": "review-fw-",
    "suite": ["ee_design_review", "ee_design_review_data", "me_design_review", "me_design_review_data", "signoff", "pcb_dfm", "signoff_pl", "signoff_pl_data"]
  },
  "ids": { "project": "f", "comment": "fc", "custom": "fx" },
  "templateOrder": ["requirements", "hw-interface", "boot-memory", "concurrency", "power", "comms", "security", "update", "quality", "test", "release"],
  "templatePrefixes": {
    "requirements": "req", "hw-interface": "hsi", "boot-memory": "mem", "concurrency": "rtos", "power": "pwr",
    "comms": "com", "security": "sec", "update": "ota", "quality": "cq", "test": "tst", "release": "rel"
  },
  "defaultChecklists": ["requirements", "hw-interface", "boot-memory", "concurrency", "security", "quality", "test", "release"],
  "stages": ["Concept", "Architecture", "Implementation", "Integration (EVT)", "Validation (DVT)", "Release candidate", "Released"],
  "defaultStage": "Implementation",
  "legacyTabs": [],
  "words": {
    "unit": "target",
    "units": "targets",
    "thing": "firmware",
    "general": "General firmware",
    "profile": "Firmware profile",
    "number": "Firmware / image number",
    "numberPlaceholder": "e.g. FW-2041",
    "namePlaceholder": "e.g. Main MCU application"
  },
  "tags": [
    { "id": "bare-metal", "label": "Bare metal", "desc": "Superloop or event loop, no RTOS" },
    { "id": "rtos", "label": "RTOS", "desc": "FreeRTOS, Zephyr, ThreadX and similar" },
    { "id": "multi-core", "label": "Multiple processors", "desc": "Co-processor, radio SoC, dual core" },
    { "id": "wireless", "label": "Wireless", "desc": "Wi-Fi, BLE, Thread, LoRa, cellular" },
    { "id": "cloud", "label": "Cloud connected", "desc": "Backend, MQTT / HTTPS, device fleet" },
    { "id": "ota", "label": "Field updates", "desc": "Over the air or field-updatable images" },
    { "id": "usb", "label": "USB", "desc": "USB device or host" },
    { "id": "battery", "label": "Battery", "desc": "Battery powered, charging, fuel gauge" },
    { "id": "low-power", "label": "Low power", "desc": "Sleep modes, energy budget" },
    { "id": "display-ui", "label": "Display / UI", "desc": "Display, touch, GUI" },
    { "id": "sensing", "label": "Sensing", "desc": "ADC, sensors, filtering, calibration" },
    { "id": "actuators", "label": "Outputs", "desc": "Relays, heaters, valves, solenoids" },
    { "id": "motor-control", "label": "Motor control", "desc": "PWM, closed loop, power stages" },
    { "id": "storage", "label": "Storage", "desc": "External flash, file system, logging" },
    { "id": "security-sensitive", "label": "Security sensitive", "desc": "Secure boot, keys, privacy" },
    { "id": "safety", "label": "Functional safety", "desc": "IEC 60730 class B, IEC 61508" },
    { "id": "medical", "label": "Medical", "desc": "IEC 62304 software" },
    { "id": "high-volume", "label": "Volume production", "desc": "Factory programming, provisioning" }
  ],
  "demo": {
    "findings": [
      {
        "id": "hsi-pin-3",
        "sev": "critical",
        "who": "Ari Chen",
        "by": "Sam Patel",
        "ref": "Relay drive pins, K1 and K2",
        "notes": [
          "The relay driver inputs float for about 40 ms after reset, and there's no pull-down. The scope shows a 12 ms pulse on K2 (compressor call) at power-up.",
          "EE is adding 100 kΩ pull-downs on rev C. Firmware now drives the pins low first thing in SystemInit."
        ],
        "res": "fixed"
      },
      {
        "id": "mem-fault-1",
        "sev": "critical",
        "who": "Ari Chen",
        "by": "Jordan Brooks",
        "ref": "wdt.c",
        "notes": [
          "The watchdog is fed from the 1 ms tick hook, so a hung UI task never trips it.",
          "Now each of the five tasks checks in, and the monitor task feeds the watchdog only when all of them have."
        ],
        "res": "fixed"
      },
      {
        "id": "ota-upd-2",
        "sev": "critical",
        "who": "Jordan Brooks",
        "by": "Ari Chen",
        "ref": "ota_confirm()",
        "notes": [
          "A new image is marked permanent before the app has connected to Wi-Fi. A build that crashes once it connects stays installed.",
          "Proposal: confirm only after the first successful cloud check-in, with a 10-minute deadline before rolling back."
        ],
        "res": ""
      },
      {
        "id": "sec-key-1",
        "sev": "critical",
        "who": "Jordan Brooks",
        "by": "Sam Patel",
        "ref": "config/cloud.h",
        "notes": [
          "The staging backend's API key is in the header and in the git history.",
          "Key rotated. Per-device certificates replace it in the next build."
        ],
        "res": "fixed"
      },
      {
        "id": "rtos-sync-1",
        "sev": "major",
        "who": "Ari Chen",
        "by": "Jordan Brooks",
        "ref": "schedule_t",
        "notes": [
          "The UI task writes schedule entries while the control task reads them, with no lock. The 8-byte entries can tear."
        ],
        "res": ""
      },
      {
        "id": "mem-nv-2",
        "sev": "major",
        "who": "Jordan Brooks",
        "by": "Ari Chen",
        "ref": "settings.c",
        "notes": [
          "The schedule is saved to one flash page by erase-then-write. A power cut in between loses the whole schedule.",
          "Moving to two pages with a sequence number and CRC, so the newer valid copy wins."
        ],
        "res": ""
      },
      {
        "id": "com-rf-3",
        "sev": "major",
        "who": "Jordan Brooks",
        "by": "Ari Chen",
        "ref": "net_connect()",
        "notes": [
          "Reconnect retries every 2 s forever. After a router reboot, all 20 bench units reconnected in lockstep."
        ],
        "res": ""
      },
      {
        "id": "hsi-ui-3",
        "sev": "major",
        "who": "Ari Chen",
        "by": "Sam Patel",
        "ref": "Touch controller",
        "notes": [
          "At ±8 kV contact on the bezel, the touch controller stops sending interrupts. Only a power cycle brings it back.",
          "Added a check: no touch interrupt for 2 s while the panel is awake resets the controller over its reset line. Retest booked."
        ],
        "res": ""
      },
      {
        "id": "hsi-act-2",
        "sev": "major",
        "who": "",
        "by": "Sam Patel",
        "ref": "Y1 compressor call",
        "notes": [
          "No minimum off time for the compressor. Acme's spec asks for 5 minutes.",
          "Added a 5-minute minimum off time, adjustable from 2 to 10 minutes in the installer menu."
        ],
        "res": "fixed"
      }
    ],
    "comments": [
      {
        "id": "hsi-clk-2",
        "by": "Ari Chen",
        "text": "Measured UART baud error at the 160 MHz system clock: 0.08%. OK."
      },
      {
        "id": "rtos-task-2",
        "by": "Jordan Brooks",
        "text": "SystemView capture under full load: the control task's worst case is 1.8 ms against its 10 ms period."
      },
      {
        "id": "req-arch-3",
        "by": "Sam Patel",
        "text": "Map file at v0.9.0: 1.41 MB of the 1.75 MB app slot (81%), 212 kB of 320 kB RAM. Is that enough room for OTA growth?"
      },
      {
        "id": "sec-vul-2",
        "by": "Jordan Brooks",
        "text": "EN 18031-1 applies, since it's internet-connected radio equipment. Mapping started in the security doc."
      }
    ],
    "projects": [
      {
        "seed": 3,
        "users": [
          "Jordan Brooks",
          "Ari Chen"
        ],
        "findings": [
          "hsi-pin-3",
          "mem-fault-1",
          "ota-upd-2",
          "sec-key-1",
          "rtos-sync-1",
          "mem-nv-2",
          "com-rf-3",
          "hsi-ui-3",
          "hsi-act-2"
        ],
        "comments": [
          "hsi-clk-2",
          "rtos-task-2",
          "req-arch-3",
          "sec-vul-2"
        ],
        "requirements": [{"parent": {"project": "pldemo", "id": "qdemo-ota", "ref": "REQ-009", "text": "Firmware shall update over the air and roll back after a failed image."}, "ref": "REQ-001", "text": "The bootloader shall keep the last good image and boot it after a failed update.", "category": "Firmware", "source": "Kickoff notes 2026-09-02", "method": "demonstration", "status": "approved", "verify": "open", "links": ["ota-upd-1", "ota-upd-2"], "by": "Jordan Brooks"}, {"parent": {"project": "pldemo", "id": "qdemo-esd", "ref": "REQ-002", "text": "Every user-accessible point shall withstand ±8 kV contact and ±15 kV air ESD."}, "ref": "REQ-002", "text": "The touch controller shall recover from an ESD event without a user-visible reset.", "category": "Interfaces", "source": "Acme DT-SPEC-12 §6.4", "method": "test", "status": "approved", "verify": "fail", "evidence": "ESD pre-scan 2026-10-21: touch stopped responding at ±8 kV contact on the bezel until power was cycled.", "links": ["hsi-ui-3", "tst-rob-3"], "by": "Ari Chen"}, {"ref": "REQ-003", "text": "Relay outputs shall be off within 100 ms of a reset, a watchdog timeout or a firmware fault.", "category": "Safety", "source": "Acme DT-SPEC-12 §4.5", "method": "test", "status": "approved", "verify": "pass", "evidence": "Bench run 2026-10-28: 500 forced watchdog resets, relays off within 4–9 ms each time.", "links": ["hsi-act-1", "hsi-pin-3", "mem-fault-1"], "by": "Ari Chen"}, {"ref": "REQ-004", "text": "The thermostat should keep its schedule and setpoints through a power cut of any length.", "kind": "should", "category": "Storage", "source": "Installer workshop 2026-09-15", "method": "demonstration", "status": "draft", "verify": "open", "links": ["mem-nv-2", "pwr-loss-2"], "by": "Jordan Brooks"}, {"ref": "REQ-005", "text": "Wi-Fi credentials and the device certificate shall be stored encrypted and never logged.", "category": "Security", "source": "Acme security questionnaire", "method": "inspection", "status": "approved", "verify": "open", "links": ["sec-key-3", "sec-key-4"], "by": "Jordan Brooks"}],
        "ratios": {
          "requirements": 0.8,
          "hw-interface": 0.6,
          "boot-memory": 0.5,
          "concurrency": 0.55,
          "power": 0.4,
          "comms": 0.45,
          "security": 0.35,
          "update": 0.3,
          "quality": 0.6,
          "test": 0.25,
          "release": 0.15
        },
        "fields": {
          "name": "Thermostat Firmware",
          "project": "Smart Thermostat",
          "client": "Acme Climate",
          "board": "DT-1042-FW",
          "revision": "0.9.0",
          "stage": "Integration (EVT)",
          "description": "EVT review of the main application and bootloader on the Main PCBA's Wi-Fi module: FreeRTOS, touch UI on the display board, temperature and humidity control of the HVAC relays, cloud schedules, and A/B over-the-air updates.",
          "profile": [
            "rtos",
            "wireless",
            "cloud",
            "ota",
            "display-ui",
            "sensing",
            "actuators",
            "security-sensitive",
            "high-volume"
          ],
          "checklists": [
            "requirements",
            "hw-interface",
            "boot-memory",
            "concurrency",
            "power",
            "comms",
            "security",
            "update",
            "quality",
            "test",
            "release"
          ]
        }
      }
    ]
  }
};

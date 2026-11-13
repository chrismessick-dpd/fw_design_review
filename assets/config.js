/* Signoff FW: everything that differs between the Signoff tools (EE, ME, FW). The shared engine
   (model.js, github.js, workspace.js, app.js, demo.js, styles.css, and tools/*.py, vendored
   from ee_design_review by tools/sync_engine.py) reads this. Keep the part after "=" strict
   JSON: tools/build.py, validate_templates.py, and package.py parse it too.

   storage.ns:     localStorage namespace for this tool. The GitHub token (signoff.token) and
                   the theme (signoff.v1.settings -> theme) are shared by every Signoff tool.
   repos:          defaults for Settings -> Repositories. prefix must not be a prefix of
                   another tool's (contractors find their repos by name prefix).
   repos.suite:    other repositories every FTE is invited to, next to this tool's own:
                   the other disciplines' tool and data repos, and the hub.
   ids:            prefixes for new project, comment, and custom-check IDs.
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
    "suite": ["ee_design_review", "ee_design_review_data", "me_design_review", "me_design_review_data", "signoff", "pcb_dfm", "signoff_pl", "signoff_pl_data", "signoff_tickets"]
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
  "pl": { "tool": "fw", "dataRepo": "signoff_pl_data" },
  "spec": {
    "label": "Scribe", "default": true, "guide": 3,
    "template": [
      {"lines": ["# {name} * product", "What does this firmware do, on which processor, and for whom? Name the boards it runs on and what it controls."]},
      {"when": ["rtos"], "lines": ["## Software structure", "Which RTOS, and which tasks at which priorities? How do tasks share data (queues, events, or mutexes), and which task owns each peripheral?", "Uses: Application, Measurement, Output control, Motor control, User interface, Connectivity, Cloud link, USB link, Data logging, Update agent, Power manager"]},
      {"when": ["bare-metal"], "unless": ["rtos"], "lines": ["## Software structure", "Superloop or event loop: what runs in the loop, and what runs in interrupts? What is the longest the loop can take?", "Uses: Application, Measurement, Output control, Motor control, User interface, Connectivity, Cloud link, USB link, Data logging, Update agent, Power manager"]},
      {"unless": ["rtos", "bare-metal"], "lines": ["## Software structure", "How is the firmware built: an RTOS with tasks, or a main loop with interrupts? Which parts own which peripherals?", "Uses: Application, Measurement, Output control, Motor control, User interface, Connectivity, Cloud link, USB link, Data logging, Update agent, Power manager"]},
      {"lines": ["### Application * task", "What states does the firmware move through (start-up, idle, running, and fault), and what moves it from one to the next?", "Uses: Measurement, Output control, Motor control, Fault handling"]},
      {"when": ["sensing"], "lines": ["### Measurement * task", "What does it measure, how often, and through which sensors or ADC channels? How are readings filtered and calibrated, and what counts as a bad reading?", "Uses: ADC and sensor driver"]},
      {"when": ["actuators"], "lines": ["### Output control * task", "Which outputs (relays, heaters, valves, or solenoids) does it drive, and when? What state is each output in at reset and after a fault?", "Uses: Output driver"]},
      {"when": ["motor-control"], "lines": ["### Motor control * task", "Which motor, and what kind of control (open loop, speed, position, or torque)? What are the loop rate and the limits, and how does it stop on a fault?", "Uses: Motor driver"]},
      {"when": ["display-ui"], "lines": ["### User interface * task", "Which screens, inputs, and alarms does the user see? How quickly must it respond to a press?", "Uses: Display driver, Input driver"]},
      {"when": ["wireless"], "lines": ["### Connectivity * task", "Which radio and protocol (Wi-Fi, BLE, Thread, LoRa, or cellular)? How does it pair or join, and what happens when the link drops?", "Uses: Radio driver"]},
      {"when": ["cloud"], "lines": ["### Cloud link * task", "Which backend and protocol (MQTT or HTTPS)? What is sent and how often, how is the device authenticated, and what is kept while offline?", "Uses: Connectivity"]},
      {"when": ["usb"], "lines": ["### USB link * task", "Device or host, and which classes (CDC, HID, MSC, or vendor)? What does the other end send, and what is it allowed to change?", "Uses: USB driver"]},
      {"when": ["storage"], "lines": ["### Data logging * task", "What is stored (settings, logs, or records), where, and how much? How is it kept consistent through a power cut, and how long must it last?", "Uses: Storage driver"]},
      {"when": ["ota"], "lines": ["### Update agent * task", "Where do new images come from, and how are they checked before they boot?", "Uses: Bootloader"]},
      {"when": ["low-power", "battery"], "lines": ["### Power manager * module", "Which sleep modes, and what wakes the firmware? What is the energy budget, and what happens at low battery?", "Uses: Battery driver"]},
      {"lines": ["### Fault handling * module", "Which faults are detected (watchdog, brown-out, stack overflow, or a failed self-test), and what safe state does each lead to? How is a fault reported and logged?", "Uses: Self-tests"]},
      {"when": ["safety"], "lines": ["### Self-tests * module", "Which start-up and periodic self-tests run (CPU registers, RAM, flash CRC, clock, and I/O), and how often? Which class or SIL do they meet?"]},
      {"when": ["security-sensitive"], "lines": ["### Security * module", "Which keys and secrets does it hold, and where? What does secure boot check, and what does the debug lock cover?"]},
      {"lines": ["## Drivers"]},
      {"when": ["sensing"], "lines": ["### ADC and sensor driver * driver", "Which ADC channels and sensor buses (I2C or SPI), at what rate, and with DMA or interrupts?", "Uses: Main board"]},
      {"when": ["actuators"], "lines": ["### Output driver * driver", "Which pins drive each output, and what holds them off through reset and boot?", "Uses: Main board"]},
      {"when": ["motor-control"], "lines": ["### Motor driver * driver", "Which timer and PWM channels, at what frequency and dead time? Which feedback (encoder, Hall sensors, or current sense), and which hardware fault input stops the PWM?", "Uses: Main board"]},
      {"when": ["display-ui"], "lines": ["### Display driver * driver", "Which display and bus (SPI, parallel, or MIPI), at what frame rate?", "Uses: Main board"]},
      {"when": ["display-ui"], "lines": ["### Input driver * driver", "Which buttons, touch controller, or encoder, and how are inputs debounced?", "Uses: Main board"]},
      {"when": ["wireless"], "lines": ["### Radio driver * driver", "Which radio module or stack, and which vendor code does it wrap?", "Uses: Main board"]},
      {"when": ["usb"], "lines": ["### USB driver * driver", "Which USB stack and speed? How are connect, disconnect, and suspend handled?", "Uses: Main board"]},
      {"when": ["storage"], "lines": ["### Storage driver * driver", "Which memory (internal flash, external flash, EEPROM, or SD card), and which file system or wear leveling?", "Uses: Main board"]},
      {"when": ["battery"], "lines": ["### Battery driver * driver", "Which charger and fuel gauge, and how are they read?", "Uses: Main board"]},
      {"lines": ["## Bootloader * module", "How does the firmware start: which bootloader, which image does it pick, and how is the image checked? How is a new image loaded in production and in the field?"]},
      {"lines": ["## Hardware", "### Main board * hardware", "Which processor, at what clock, and on which board? Name the parts the firmware drives directly."]},
      {"lines": ["## Interfaces"]},
      {"when": ["usb"], "lines": ["### USB protocol * interface", "What does the host send, and what does the firmware answer? One row per message.", "Uses: USB link", "", "| Message | Direction | Fields | Meaning |", "| --- | --- | --- | --- |", "| | | | |"]},
      {"when": ["cloud"], "lines": ["### Cloud messages * interface", "What does the device publish and receive, and in what format? One row per message.", "Uses: Cloud link", "", "| Message | Direction | Rate | Fields |", "| --- | --- | --- | --- |", "| | | | |"]},
      {"when": ["wireless"], "unless": ["cloud"], "lines": ["### Wireless protocol * interface", "What does the radio link carry (services, characteristics, or messages)? One row per message.", "Uses: Connectivity", "", "| Message | Direction | Fields | Meaning |", "| --- | --- | --- | --- |", "| | | | |"]},
      {"when": ["multi-core"], "lines": ["### Inter-processor link * interface", "Which processors talk, over which bus, and what messages pass between them? One row per message.", "Uses: Application", "", "| Message | Direction | Fields | Meaning |", "| --- | --- | --- | --- |", "| | | | |"]},
      {"when": ["medical"], "lines": ["## Software safety classification", "Which IEC 62304 class (A, B, or C) is each software item, and why? Which hazards can the software contribute to?"]},
      {"when": ["medical", "safety"], "lines": ["## Risk controls", "Which risk controls does the firmware carry out? Link each one to its requirement and to the risk file."]},
      {"when": ["medical"], "lines": ["## SOUP", "Which third-party software is used (RTOS, stacks, and libraries), at which version, and what is it relied on for?", "", "| SOUP | Version | Used for | Known anomalies checked |", "| --- | --- | --- | --- |", "| | | | |"]},
      {"when": ["high-volume"], "lines": ["## Manufacturing", "How is the firmware programmed and provisioned in the factory (serial numbers, keys, and calibration)? What does the end-of-line test check?"]}
    ]
  },
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
    { "id": "rtos", "label": "RTOS", "desc": "FreeRTOS, Zephyr, ThreadX, and similar" },
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
        "spec": [
          "# Thermostat firmware · product",
          "> Runs a home's heating and cooling from a touch display, on a schedule set on the wall or in the app.",
          "[The firmware runs on the Main PCBA's Wi-Fi module and drives the display and sensor board over a flat flex cable.]{std} It keeps the room at its setpoint by switching separate heat and cool relays. [Schedules and setpoints are kept through a power cut of any length]{REQ-004}, and the firmware updates itself over the air. [The thermostat is sold to homeowners, so first-run setup has to work without an installer.]{std}",
          "",
          "## Software structure",
          "> FreeRTOS with four application tasks; the control loop has the highest priority.",
          "[The firmware is built on FreeRTOS on the module's single core.]{std} Each task owns its peripherals, and tasks talk to each other only through queues.",
          "Uses: Control loop, Touch UI, Cloud link, Update agent",
          "",
          "### Control loop · task",
          "> Once a second, reads the room and decides whether to call for heat or cooling.",
          "The control loop runs once a second at the highest application priority. It switches the heat or cool relay with 0.5 °C (0.9 °F) of hysteresis and never calls for both at once. [On any fault it stops calling and leaves both relays off]{REQ-003}.",
          "Uses: Sensor driver, Relay driver",
          "",
          "### Touch UI · task",
          "> Draws the screens and turns taps into setpoint and schedule changes.",
          "[The UI task draws at up to 30 frames a second and dims the backlight after 30 s without a touch.]{std} [If the touch controller stops reporting, the UI resets and re-initializes it without restarting the thermostat]{REQ-002}.",
          "Uses: Touch driver, Display driver, Status LED",
          "",
          "### Cloud link · task",
          "> Keeps the Wi-Fi and cloud connection up, and syncs schedules.",
          "[The cloud link connects over Wi-Fi with TLS and backs off while the network is down, up to 15 minutes between tries.]{std} It [publishes the status frame]{#Status frame} every 60 s and after every setpoint change.",
          "Uses: Wi-Fi driver",
          "",
          "### Update agent · task",
          "> Downloads a new image into the spare slot and hands it to the bootloader.",
          "Images download into the inactive slot while the thermostat keeps running. [The agent checks the image's signature before it marks the slot bootable]{REQ-001}.",
          "Uses: Bootloader",
          "",
          "## Drivers",
          "### Sensor driver · driver",
          "[Reads the temperature and humidity sensor on the display and sensor board over I2C once a second.]{std} A reading outside −10 to 50 °C (14 to 122 °F) counts as a sensor fault.",
          "Uses: Display and sensor board",
          "",
          "### Relay driver · driver",
          "[Both relay outputs are held off in hardware through a reset]{REQ-003}, and the driver turns one on only when the control loop asks.",
          "Uses: Relays",
          "",
          "### Touch driver · driver",
          "[Talks to the touch controller over I2C and reports taps and swipes to the UI.]{std}",
          "Uses: Display and sensor board",
          "",
          "### Display driver · driver",
          "[Sends frames to the display over SPI with DMA, so drawing never blocks the control loop.]{std}",
          "Uses: Display and sensor board",
          "",
          "### Status LED · driver",
          "The LED blinks at 1 Hz while a call for heat or cooling is active. Make the LED pulse instead of blink, so it's calmer at night @req.",
          "",
          "### Wi-Fi driver · driver",
          "[Wraps the module vendor's Wi-Fi stack.]{std}",
          "",
          "## Bootloader · module",
          "> Picks the image to boot and rolls back a bad update.",
          "[The bootloader keeps the last good image and boots it if the new one fails]{REQ-001}. After two failed boots of a new image, roll back without waiting for the watchdog @req.",
          "",
          "## Hardware",
          "### Display and sensor board · hardware",
          "[The display, its touch controller, and the temperature and humidity sensor are on the display and sensor board, joined to the main PCBA by a flat flex cable.]{std}",
          "",
          "### Relays · hardware",
          "[Two relays on the main PCBA switch the heat and cool calls.]{std}",
          "",
          "## Interfaces",
          "### Status frame · interface",
          "> JSON the cloud link publishes every 60 s and after every setpoint change.",
          "Uses: Cloud link",
          "[Version 2 of the frame has these fields:]{std}",
          "",
          "| Field | Type | Units | Meaning |",
          "| --- | --- | --- | --- |",
          "| v | integer | | Frame version, 2 |",
          "| temp | number | °C, 0.1 | Room temperature |",
          "| rh | number | %RH, 1 | Relative humidity |",
          "| setpoint | number | °C, 0.5 | Active setpoint |",
          "| call | string | | off, heat, or cool |",
          "| fw | string | | Firmware version |"
        ],
        "requirements": [{"parent": {"project": "pldemo", "id": "qdemo-ota", "ref": "REQ-009", "text": "Firmware shall update over the air and roll back after a failed image."}, "ref": "REQ-001", "text": "The bootloader shall keep the last good image and boot it after a failed update.", "category": "Firmware", "source": "Kickoff notes 2026-09-02", "method": "demonstration", "status": "approved", "verify": "open", "links": ["ota-upd-1", "ota-upd-2"], "by": "Jordan Brooks"}, {"parent": {"project": "pldemo", "id": "qdemo-esd", "ref": "REQ-002", "text": "Every user-accessible point shall withstand ±8 kV contact and ±15 kV air ESD."}, "ref": "REQ-002", "text": "The touch controller shall recover from an ESD event without a user-visible reset.", "category": "Interfaces", "source": "Acme DT-SPEC-12 §6.4", "method": "test", "status": "approved", "verify": "fail", "evidence": "ESD pre-scan 2026-10-21: touch stopped responding at ±8 kV contact on the bezel until power was cycled.", "links": ["hsi-ui-3", "tst-rob-3"], "by": "Ari Chen"}, {"ref": "REQ-003", "text": "Relay outputs shall be off within 100 ms of a reset, a watchdog timeout, or a firmware fault.", "category": "Safety", "source": "Acme DT-SPEC-12 §4.5", "method": "test", "status": "approved", "verify": "pass", "evidence": "Bench run 2026-10-28: 500 forced watchdog resets, relays off within 4–9 ms each time.", "links": ["hsi-act-1", "hsi-pin-3", "mem-fault-1"], "by": "Ari Chen"}, {"ref": "REQ-004", "text": "The thermostat should keep its schedule and setpoints through a power cut of any length.", "kind": "should", "category": "Storage", "source": "Installer workshop 2026-09-15", "method": "demonstration", "status": "draft", "verify": "open", "links": ["mem-nv-2", "pwr-loss-2"], "by": "Jordan Brooks"}, {"ref": "REQ-005", "text": "Wi-Fi credentials and the device certificate shall be stored encrypted and never logged.", "category": "Security", "source": "Acme security questionnaire", "method": "inspection", "status": "approved", "verify": "open", "links": ["sec-key-3", "sec-key-4"], "by": "Jordan Brooks"}],
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

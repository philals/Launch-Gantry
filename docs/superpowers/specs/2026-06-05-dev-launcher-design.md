# Dev Launcher — Design Spec

**Date:** 2026-06-05  
**Status:** Approved

## Problem

Working across ~20+ repos, each requiring a different IDE, docker-compose stack, and npm commands. Goal: one-click dock/Activities icons per repo on Ubuntu GNOME that open the correct IDE and terminals for that project.

---

## Architecture Overview

Three-layer system: a central YAML config, a Node.js generator CLI, and the generated output (icons, launcher scripts, desktop files).

```
~/dev-launcher/
├── launcher.config.yml          # gitignored — personal config (edit this)
├── launcher.config.example.yml  # committed — documented template
├── package.json
├── generate.js                  # CLI: reads config, writes all output
├── .gitignore
└── output/
    ├── icons/                   # generated SVGs (one per project)
    ├── scripts/                 # generated bash launcher scripts
    └── desktop/                 # generated .desktop files
```

**Generation flow:**

1. `node generate.js` reads `launcher.config.yml`
2. For each project: generates SVG icon, bash launcher script, `.desktop` file
3. Symlinks `.desktop` files into `~/.local/share/applications/`
4. Makes launcher scripts executable

Icons are referenced by absolute path — no install step needed for them.

---

## Config Format

```yaml
# launcher.config.yml
defaults:
  ide: vscode              # vscode | idea
  terminal: gnome-terminal

projects:
  - name: Landonline Admin Portal
    tla: LAP
    color: "#4A90D9"       # icon background colour
    path: ~/code/landonline-admin-portal
    ide: vscode            # optional — overrides defaults.ide
    docker:
      - command: docker-compose up
        cwd: ~/code/landonline-admin-portal   # optional — defaults to path
    npm:
      - name: Dev Server   # used as terminal window title
        command: npm run dev
        cwd: ~/code/landonline-admin-portal
```

**Design decisions:**

- `defaults` block reduces repetition across projects
- `docker` and `npm` are arrays — supports multiple commands per project (e.g. two docker stacks, or `npm run dev` + `npm run watch`)
- `docker` and `npm` are both optional — if omitted, no terminal opens for that category
- `cwd` on each command defaults to the project `path` if omitted
- `color` is the only visual config; TLA text is always white
- `name` on npm/docker tasks becomes the gnome-terminal window title; falls back to the command string if omitted

---

## Icon Generation

Each project gets a 128×128 SVG: rounded rectangle in `color`, white TLA text centred. Font size scales by TLA length (2 chars = larger, 3–4 chars = smaller).

Generated via a pure SVG string template in `generate.js` — no external image dependencies.

Output path: `output/icons/<tla-lowercase>.svg`

---

## Bash Launcher Script

Generated per project at `output/scripts/<tla-lowercase>.sh`:

```bash
#!/bin/bash

# IDE
code ~/code/landonline-admin-portal &

# Docker
gnome-terminal --title="LAP — Docker" \
  -- bash -c "cd ~/code/landonline-admin-portal && docker-compose up; exec bash" &

# npm
gnome-terminal --title="LAP — Dev Server" \
  -- bash -c "cd ~/code/landonline-admin-portal && npm run dev; exec bash" &
```

**Key details:**

- `exec bash` keeps terminal windows open after the process exits (crash visibility)
- All commands run with `&` — launcher script exits immediately, GNOME doesn't hang
- Each terminal gets a descriptive title (from `name` field or command name fallback)
- `~` paths are expanded at generation time to absolute paths for reliability

---

## `.desktop` File

Generated per project at `output/desktop/<tla-lowercase>.desktop`, symlinked to `~/.local/share/applications/`:

```ini
[Desktop Entry]
Version=1.0
Type=Application
Name=Landonline Admin Portal
Comment=LAP dev environment
Icon=/home/user/dev-launcher/output/icons/lap.svg
Exec=/home/user/dev-launcher/output/scripts/lap.sh
Terminal=false
Categories=Development;
```

`Terminal=false` — the launcher script manages its own terminal windows; no blank terminal on click.

---

## Git / Sharing

`.gitignore` excludes:
```
launcher.config.yml
output/
```

`output/` is excluded because it contains absolute paths specific to the user's machine. Anyone cloning copies `launcher.config.example.yml` → `launcher.config.yml`, edits their paths, and runs `node generate.js`.

---

## CLI Interface

```bash
node generate.js              # regenerate all projects
node generate.js --project LAP  # regenerate one project by TLA
node generate.js --clean      # remove all symlinks and output, start fresh
```

---

## Success Criteria

- Clicking a dock/Activities icon opens the correct IDE and terminal windows with no extra interaction
- Adding a new project requires only editing `launcher.config.yml` and running `node generate.js`
- The repo is safe to publish on GitHub without leaking personal paths or config

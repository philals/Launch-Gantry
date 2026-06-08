# Gantry Launcher — Design Spec
_2026-06-08_

## Overview

A single "Launch Gantry" dock icon (`LG`) that exposes all opted-in projects as right-click Desktop Actions. Pinning one icon gives quick access to any project without cluttering the dock with individual entries.

## Config

Each project gains an optional `launcher` boolean (default `false`). Projects with `launcher: true` appear in the right-click menu.

```yaml
- name: Landonline Notices
  tla: NOT
  launcher: true
  ...
```

## Generated Files

`generate.js` produces a `gantry.desktop` file alongside the per-project files whenever it runs without a `--project` filter. The gantry entry:

- Uses TLA `LG` and a generated SVG icon in the same style as project icons
- Sets `Exec=` to a notify-send hint ("Right-click to select a project") so left-clicking is not silent but also not disruptive
- Declares `Actions=<TLA1>;<TLA2>;...` listing every launcher-enabled project
- Adds a `[Desktop Action <TLA>]` section per project referencing its existing launch script

Script paths are derived deterministically (`output/scripts/<tla>.sh`), so gantry generation doesn't need to be part of the per-project loop.

## .desktop Format

```
[Desktop Entry]
Version=1.0
Type=Application
Name=Launch Gantry
Comment=LG project launcher
Icon=/abs/path/to/output/icons/lg.svg
Exec=bash -c 'notify-send "Launch Gantry" "Right-click to select a project" 2>/dev/null || true'
Terminal=false
Categories=Development;
Actions=NOT;SIG;

[Desktop Action NOT]
Name=Landonline Notices
Exec=/abs/path/to/output/scripts/not.sh

[Desktop Action SIG]
Name=Landonline Signature Domain
Exec=/abs/path/to/output/scripts/sig.sh
```

## Components

| File | Change |
|---|---|
| `src/config.js` | Read `launcher` field in `normalizeProject`, default `false` |
| `src/desktop.js` | Add `generateGantryDesktop(entries, { iconPath })` |
| `generate.js` | After per-project loop (no `--project` filter): filter launcher projects, generate icon + desktop, write + symlink |
| `install.js` | No changes — existing `writeIcon`/`writeDesktop`/`symlinkDesktop` handle arbitrary TLAs |

## Error Handling

- If no projects have `launcher: true`, the gantry file is not generated (nothing to show).
- If `--project` is active, gantry generation is skipped entirely (focused regeneration of one project should not clobber the launcher).

## Testing

- `test/config.test.js` — `launcher` defaults to `false`; `launcher: true` is preserved
- `test/desktop.test.js` — `generateGantryDesktop` produces correct `Actions=` line, correct number of `[Desktop Action]` sections, correct `Name=` and `Exec=` per entry

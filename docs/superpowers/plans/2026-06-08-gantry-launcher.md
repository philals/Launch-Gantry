# Gantry Launcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single `LG` dock icon that exposes all opted-in projects as right-click Desktop Actions.

**Architecture:** A `launcher: true` boolean on each project controls inclusion. `generate.js` produces a `gantry.desktop` file (alongside per-project files) using a new `generateGantryDesktop()` function. Script paths are derived deterministically so gantry generation is independent of the per-project loop.

**Tech Stack:** Node.js ESM, js-yaml, freedesktop `.desktop` format, node:test

---

### Task 1: Add `launcher` field to config

**Files:**
- Modify: `src/config.js`
- Test: `test/config.test.js`

- [ ] **Step 1: Write the failing tests**

Add to `test/config.test.js` after the existing tests:

```js
  it('launcher defaults to false when omitted', () => {
    const p = writeTmp('cfg7.yml', `
defaults:
  ide: vscode
projects:
  - name: My App
    tla: APP
    color: "#ff0000"
    path: /tmp/myapp
`)
    const { projects } = loadConfig(p)
    assert.equal(projects[0].launcher, false)
    unlinkSync(p)
  })

  it('launcher is true when set', () => {
    const p = writeTmp('cfg8.yml', `
defaults:
  ide: vscode
projects:
  - name: My App
    tla: APP
    color: "#ff0000"
    path: /tmp/myapp
    launcher: true
`)
    const { projects } = loadConfig(p)
    assert.equal(projects[0].launcher, true)
    unlinkSync(p)
  })
```

- [ ] **Step 2: Run to verify they fail**

```
node --test test/config.test.js
```
Expected: 2 failures — `projects[0].launcher` is `undefined`.

- [ ] **Step 3: Add `launcher` to `normalizeProject` in `src/config.js`**

In `normalizeProject`, add `launcher` to the returned object (after `icon`):

```js
function normalizeProject(project, defaults, configDir) {
  const projectPath = expandTilde(project.path)
  const icon = project.icon ? resolve(configDir, project.icon) : null
  return {
    name: project.name,
    tla: project.tla,
    color: project.color || '#4A90D9',
    path: projectPath,
    icon,
    launcher: project.launcher === true,
    ide: project.ide || defaults.ide,
    docker: (project.docker || []).map(cmd => normalizeCommand(cmd, projectPath)),
    npm: (project.npm || []).map(cmd => normalizeCommand(cmd, projectPath)),
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
node --test test/config.test.js
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/config.js test/config.test.js
git commit -m "feat: add launcher field to project config"
```

---

### Task 2: Add `generateGantryDesktop` to desktop.js

**Files:**
- Modify: `src/desktop.js`
- Test: `test/desktop.test.js`

- [ ] **Step 1: Write the failing tests**

Add to `test/desktop.test.js` after the existing tests:

```js
import { generateGantryDesktop } from '../src/desktop.js'

const gantryEntries = [
  { name: 'Landonline Notices', tla: 'NOT', scriptPath: '/out/scripts/not.sh' },
  { name: 'Landonline Signature Domain', tla: 'SIG', scriptPath: '/out/scripts/sig.sh' },
]
const gantryOpts = { iconPath: '/out/icons/lg.svg' }

describe('generateGantryDesktop', () => {
  it('sets Name to Launch Gantry', () => {
    assert.ok(generateGantryDesktop(gantryEntries, gantryOpts).includes('Name=Launch Gantry'))
  })

  it('sets Icon to the gantry icon path', () => {
    assert.ok(generateGantryDesktop(gantryEntries, gantryOpts).includes('Icon=/out/icons/lg.svg'))
  })

  it('sets Terminal=false', () => {
    assert.ok(generateGantryDesktop(gantryEntries, gantryOpts).includes('Terminal=false'))
  })

  it('lists all project TLAs in Actions= line', () => {
    assert.ok(generateGantryDesktop(gantryEntries, gantryOpts).includes('Actions=NOT;SIG;'))
  })

  it('includes a [Desktop Action] section for each entry', () => {
    const out = generateGantryDesktop(gantryEntries, gantryOpts)
    assert.ok(out.includes('[Desktop Action NOT]'))
    assert.ok(out.includes('[Desktop Action SIG]'))
  })

  it('each action has the correct Name', () => {
    const out = generateGantryDesktop(gantryEntries, gantryOpts)
    assert.ok(out.includes('Name=Landonline Notices'))
    assert.ok(out.includes('Name=Landonline Signature Domain'))
  })

  it('each action has the correct Exec pointing to its script', () => {
    const out = generateGantryDesktop(gantryEntries, gantryOpts)
    assert.ok(out.includes('Exec=/out/scripts/not.sh'))
    assert.ok(out.includes('Exec=/out/scripts/sig.sh'))
  })

  it('returns empty string when entries list is empty', () => {
    assert.equal(generateGantryDesktop([], gantryOpts), '')
  })
})
```

- [ ] **Step 2: Update the import line at the top of the test file**

The existing import is:
```js
import { generateDesktop } from '../src/desktop.js'
```
Change it to:
```js
import { generateDesktop, generateGantryDesktop } from '../src/desktop.js'
```

- [ ] **Step 3: Run to verify they fail**

```
node --test test/desktop.test.js
```
Expected: failures — `generateGantryDesktop` is not exported.

- [ ] **Step 4: Implement `generateGantryDesktop` in `src/desktop.js`**

Append to `src/desktop.js` (after the existing `generateDesktop` function):

```js
export function generateGantryDesktop(entries, { iconPath }) {
  if (entries.length === 0) return ''

  const actions = entries.map(e => e.tla).join(';') + ';'
  const actionSections = entries.map(e => `
[Desktop Action ${e.tla}]
Name=${e.name}
Exec=${e.scriptPath}`).join('\n')

  return `[Desktop Entry]
Version=1.0
Type=Application
Name=Launch Gantry
Comment=LG project launcher
Icon=${iconPath}
Exec=bash -c 'notify-send "Launch Gantry" "Right-click to select a project" 2>/dev/null || true'
Terminal=false
Categories=Development;
Actions=${actions}
${actionSections}
`
}
```

- [ ] **Step 5: Run tests to verify they pass**

```
node --test test/desktop.test.js
```
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/desktop.js test/desktop.test.js
git commit -m "feat: add generateGantryDesktop"
```

---

### Task 3: Wire gantry generation into generate.js

**Files:**
- Modify: `generate.js`

No new unit tests — this is integration glue. Manual verification at the end.

- [ ] **Step 1: Update the import at the top of `generate.js`**

Change:
```js
import { generateDesktop } from './src/desktop.js'
```
To:
```js
import { generateDesktop, generateGantryDesktop } from './src/desktop.js'
```

- [ ] **Step 2: Add gantry generation block after the loop**

After the loop (before the final `console.log`), add:

```js
if (!projectFilter) {
  const launcherProjects = config.projects.filter(p => p.launcher)
  if (launcherProjects.length > 0) {
    const gantryIconSvg = generateIcon({ tla: 'LG', color: '#37474F' })
    const gantryIconPath = writeIcon(OUTPUT_DIR, 'gantry', gantryIconSvg)

    const gantryEntries = launcherProjects.map(p => ({
      name: p.name,
      tla: p.tla,
      scriptPath: join(OUTPUT_DIR, 'scripts', `${p.tla.toLowerCase()}.sh`),
    }))

    const gantryDesktop = generateGantryDesktop(gantryEntries, { iconPath: gantryIconPath })
    const gantryDesktopPath = writeDesktop(OUTPUT_DIR, 'gantry', gantryDesktop)
    symlinkDesktop(gantryDesktopPath)

    console.log(`\n  ✓ Gantry:  ~/.local/share/applications/gantry.desktop (${launcherProjects.length} projects)`)
  }
}
```

- [ ] **Step 4: Add `join` to the `path` import at the top of `generate.js`**

Change:
```js
import { resolve, dirname } from 'node:path'
```
To:
```js
import { resolve, dirname, join } from 'node:path'
```

- [ ] **Step 5: Run the full test suite**

```
npm test
```
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add generate.js
git commit -m "feat: generate gantry.desktop launcher with desktop actions"
```

---

### Task 4: Opt projects into the launcher via config

**Files:**
- Modify: `launcher.config.yml`

- [ ] **Step 1: Add `launcher: true` to the desired projects**

Edit `launcher.config.yml` to add `launcher: true` under each project you want in the right-click menu. Example — add it to all current projects:

```yaml
  - name: Landonline Notices
    tla: NOT
    launcher: true
    color: "#2E7D32"
    ...

  - name: Landonline Signature Domain
    tla: SIG
    launcher: true
    color: "#1565C0"
    ...

  - name: Landonline Titles BE
    tla: T
    launcher: true
    color: "#6A1B9A"
    ...

  - name: Landonline Titles Web
    tla: TW
    launcher: true
    color: "#AD1457"
    ...

  - name: Landonline NGS
    tla: NGS
    launcher: true
    color: "#00695C"
    ...
```

- [ ] **Step 2: Run generate and verify output**

```
node generate.js
```

Expected output includes a line like:
```
  ✓ Gantry:  ~/.local/share/applications/gantry.desktop (5 projects)
```

Check the generated file:
```
cat output/desktop/gantry.desktop
```

Verify it contains `Actions=NOT;SIG;T;TW;NGS;` and five `[Desktop Action]` sections.

- [ ] **Step 3: Commit**

```bash
git add launcher.config.yml
git commit -m "config: opt all projects into the gantry launcher"
```

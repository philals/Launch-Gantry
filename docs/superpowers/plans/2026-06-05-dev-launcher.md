# Dev Launcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Node.js CLI that reads a central YAML config and generates GNOME `.desktop` files, SVG icons, and bash launcher scripts so each repo gets a one-click dock icon.

**Architecture:** A generator CLI (`generate.js`) orchestrates four focused modules — config loading, icon generation, script generation, and desktop file generation — then an install module writes and symlinks everything into place. All output is gitignored; users clone, copy the example config, and run `node generate.js`.

**Tech Stack:** Node.js 20 (ES modules), `js-yaml` for YAML parsing, `node:test` + `node:assert` for tests (built-in, no extra deps), native `node:fs` for file operations.

---

## File Map

```
dev-laucher/
├── package.json
├── LICENSE
├── README.md
├── .gitignore
├── launcher.config.example.yml
├── generate.js                  # CLI entry point
├── src/
│   ├── config.js                # YAML loading, defaults merging, path expansion
│   ├── icon.js                  # SVG icon string generation
│   ├── script.js                # bash launcher script string generation
│   ├── desktop.js               # .desktop file string generation
│   └── install.js               # file writing, chmod, symlinking, clean
└── test/
    ├── config.test.js
    ├── icon.test.js
    ├── script.test.js
    └── desktop.test.js
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `LICENSE`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "dev-launcher",
  "version": "1.0.0",
  "description": "Generates GNOME .desktop files, SVG icons, and bash launcher scripts from a central YAML config.",
  "type": "module",
  "scripts": {
    "generate": "node generate.js",
    "test": "node --test test/*.test.js"
  },
  "dependencies": {
    "js-yaml": "^4.1.0"
  }
}
```

- [ ] **Step 2: Write `.gitignore`**

```
launcher.config.yml
output/
node_modules/
```

- [ ] **Step 3: Write `LICENSE`**

```
MIT License

Copyright (c) 2026 contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`

Expected: `node_modules/` created, `package-lock.json` written.

- [ ] **Step 5: Commit**

```bash
git init
git add package.json package-lock.json .gitignore LICENSE
git commit -m "chore: scaffold project"
```

---

### Task 2: Config Loader

**Files:**
- Create: `src/config.js`
- Create: `test/config.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// test/config.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadConfig } from '../src/config.js'

const HOME = process.env.HOME

function writeTmp(name, content) {
  const p = join(tmpdir(), name)
  writeFileSync(p, content, 'utf8')
  return p
}

describe('loadConfig', () => {
  it('merges ide default into projects', () => {
    const p = writeTmp('cfg1.yml', `
defaults:
  ide: idea
projects:
  - name: My App
    tla: APP
    color: "#ff0000"
    path: /tmp/myapp
`)
    const { projects } = loadConfig(p)
    assert.equal(projects[0].ide, 'idea')
    unlinkSync(p)
  })

  it('project ide overrides default', () => {
    const p = writeTmp('cfg2.yml', `
defaults:
  ide: idea
projects:
  - name: My App
    tla: APP
    color: "#ff0000"
    path: /tmp/myapp
    ide: vscode
`)
    const { projects } = loadConfig(p)
    assert.equal(projects[0].ide, 'vscode')
    unlinkSync(p)
  })

  it('expands ~ in project path', () => {
    const p = writeTmp('cfg3.yml', `
defaults:
  ide: vscode
projects:
  - name: My App
    tla: APP
    color: "#ff0000"
    path: ~/code/myapp
`)
    const { projects } = loadConfig(p)
    assert.equal(projects[0].path, `${HOME}/code/myapp`)
    unlinkSync(p)
  })

  it('sets cwd to project path when cwd omitted on npm command', () => {
    const p = writeTmp('cfg4.yml', `
defaults:
  ide: vscode
projects:
  - name: My App
    tla: APP
    color: "#ff0000"
    path: /tmp/myapp
    npm:
      - command: npm run dev
`)
    const { projects } = loadConfig(p)
    assert.equal(projects[0].npm[0].cwd, '/tmp/myapp')
    unlinkSync(p)
  })

  it('uses command as name when name omitted on docker command', () => {
    const p = writeTmp('cfg5.yml', `
defaults:
  ide: vscode
projects:
  - name: My App
    tla: APP
    color: "#ff0000"
    path: /tmp/myapp
    docker:
      - command: docker-compose up
`)
    const { projects } = loadConfig(p)
    assert.equal(projects[0].docker[0].name, 'docker-compose up')
    unlinkSync(p)
  })

  it('normalises missing docker and npm to empty arrays', () => {
    const p = writeTmp('cfg6.yml', `
defaults:
  ide: vscode
projects:
  - name: My App
    tla: APP
    color: "#ff0000"
    path: /tmp/myapp
`)
    const { projects } = loadConfig(p)
    assert.deepEqual(projects[0].docker, [])
    assert.deepEqual(projects[0].npm, [])
    unlinkSync(p)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `node --test test/config.test.js`

Expected: errors about missing module `../src/config.js`

- [ ] **Step 3: Implement `src/config.js`**

```js
// src/config.js
import { readFileSync } from 'node:fs'
import yaml from 'js-yaml'

const HOME = process.env.HOME

function expandTilde(p) {
  if (!p) return p
  return p.startsWith('~/') ? `${HOME}/${p.slice(2)}` : p
}

function normalizeCommand(cmd, projectPath) {
  return {
    name: cmd.name || cmd.command,
    command: cmd.command,
    cwd: expandTilde(cmd.cwd) || projectPath,
  }
}

function normalizeProject(project, defaults) {
  const projectPath = expandTilde(project.path)
  return {
    name: project.name,
    tla: project.tla,
    color: project.color || '#4A90D9',
    path: projectPath,
    ide: project.ide || defaults.ide,
    docker: (project.docker || []).map(cmd => normalizeCommand(cmd, projectPath)),
    npm: (project.npm || []).map(cmd => normalizeCommand(cmd, projectPath)),
  }
}

export function loadConfig(configPath) {
  const raw = yaml.load(readFileSync(configPath, 'utf8'))
  const defaults = { ide: 'vscode', terminal: 'gnome-terminal', ...raw.defaults }
  return {
    defaults,
    projects: (raw.projects || []).map(project => normalizeProject(project, defaults)),
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `node --test test/config.test.js`

Expected: `✓` for all 6 tests, no failures.

- [ ] **Step 5: Commit**

```bash
git add src/config.js test/config.test.js
git commit -m "feat: add config loader with defaults merging and path expansion"
```

---

### Task 3: Icon Generator

**Files:**
- Create: `src/icon.js`
- Create: `test/icon.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// test/icon.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateIcon } from '../src/icon.js'

describe('generateIcon', () => {
  it('returns valid SVG containing the TLA', () => {
    const svg = generateIcon({ tla: 'LAP', color: '#4A90D9' })
    assert.ok(svg.startsWith('<svg'), 'should start with <svg')
    assert.ok(svg.includes('</svg>'), 'should end with </svg>')
    assert.ok(svg.includes('LAP'), 'should contain TLA')
  })

  it('includes the project colour', () => {
    const svg = generateIcon({ tla: 'LAP', color: '#4A90D9' })
    assert.ok(svg.includes('#4A90D9'))
  })

  it('uses larger font size for shorter TLA', () => {
    const svg2 = generateIcon({ tla: 'AB', color: '#000' })
    const svg3 = generateIcon({ tla: 'ABC', color: '#000' })
    const size2 = parseInt(svg2.match(/font-size="(\d+)"/)[1], 10)
    const size3 = parseInt(svg3.match(/font-size="(\d+)"/)[1], 10)
    assert.ok(size2 > size3, '2-char TLA should have larger font than 3-char')
  })

  it('has a rect and a text element', () => {
    const svg = generateIcon({ tla: 'X', color: '#fff' })
    assert.ok(svg.includes('<rect'))
    assert.ok(svg.includes('<text'))
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `node --test test/icon.test.js`

Expected: errors about missing module `../src/icon.js`

- [ ] **Step 3: Implement `src/icon.js`**

```js
// src/icon.js
const FONT_SIZE = { 1: 56, 2: 48, 3: 36, 4: 28 }

export function generateIcon({ tla, color }) {
  const fontSize = FONT_SIZE[tla.length] ?? 24
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="16" fill="${color}"/>
  <text x="64" y="64" font-family="monospace" font-weight="bold" font-size="${fontSize}" fill="white" text-anchor="middle" dominant-baseline="central">${tla}</text>
</svg>`
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `node --test test/icon.test.js`

Expected: `✓` for all 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/icon.js test/icon.test.js
git commit -m "feat: add SVG icon generator with font size scaling"
```

---

### Task 4: Script Generator

**Files:**
- Create: `src/script.js`
- Create: `test/script.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// test/script.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateScript } from '../src/script.js'

const base = {
  name: 'My App',
  tla: 'APP',
  path: '/home/user/code/myapp',
  ide: 'vscode',
  docker: [],
  npm: [],
}

describe('generateScript', () => {
  it('starts with a bash shebang', () => {
    assert.ok(generateScript(base).startsWith('#!/bin/bash'))
  })

  it('opens vscode with "code" command', () => {
    const script = generateScript({ ...base, ide: 'vscode' })
    assert.ok(script.includes('code "/home/user/code/myapp"'))
  })

  it('opens intellij with "idea" command', () => {
    const script = generateScript({ ...base, ide: 'idea' })
    assert.ok(script.includes('idea "/home/user/code/myapp"'))
  })

  it('generates a gnome-terminal line for each docker command', () => {
    const project = {
      ...base,
      docker: [{ name: 'Stack', command: 'docker-compose up', cwd: '/home/user/code/myapp' }],
    }
    const script = generateScript(project)
    assert.ok(script.includes('docker-compose up'))
    assert.ok(script.includes('APP — Stack'))
  })

  it('generates a gnome-terminal line for each npm command', () => {
    const project = {
      ...base,
      npm: [{ name: 'Dev Server', command: 'npm run dev', cwd: '/home/user/code/myapp' }],
    }
    const script = generateScript(project)
    assert.ok(script.includes('npm run dev'))
    assert.ok(script.includes('APP — Dev Server'))
  })

  it('generates no terminal lines when docker and npm are empty', () => {
    const script = generateScript(base)
    assert.ok(!script.includes('gnome-terminal'))
  })

  it('appends exec bash to keep terminal open on process exit', () => {
    const project = {
      ...base,
      docker: [{ name: 'Stack', command: 'docker-compose up', cwd: '/tmp' }],
    }
    assert.ok(generateScript(project).includes('exec bash'))
  })

  it('runs all commands with & so launcher exits immediately', () => {
    const project = {
      ...base,
      npm: [{ name: 'Dev', command: 'npm run dev', cwd: '/tmp' }],
    }
    const script = generateScript(project)
    const ampersandLines = script.split('\n').filter(l => l.trimEnd().endsWith('&'))
    assert.ok(ampersandLines.length >= 2, 'IDE and terminal commands should both end with &')
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `node --test test/script.test.js`

Expected: errors about missing module `../src/script.js`

- [ ] **Step 3: Implement `src/script.js`**

```js
// src/script.js
const IDE_COMMANDS = { vscode: 'code', idea: 'idea' }

function terminalLine(tla, taskName, command, cwd) {
  return [
    `gnome-terminal --title="${tla} — ${taskName}" \\`,
    `  -- bash -c "cd \\"${cwd}\\" && ${command}; exec bash" &`,
  ].join('\n')
}

export function generateScript(project) {
  const ideCmd = IDE_COMMANDS[project.ide] ?? project.ide
  const lines = ['#!/bin/bash', '', `${ideCmd} "${project.path}" &`]

  for (const task of project.docker) {
    lines.push('', terminalLine(project.tla, task.name, task.command, task.cwd))
  }

  for (const task of project.npm) {
    lines.push('', terminalLine(project.tla, task.name, task.command, task.cwd))
  }

  return lines.join('\n') + '\n'
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `node --test test/script.test.js`

Expected: `✓` for all 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/script.js test/script.test.js
git commit -m "feat: add bash launcher script generator"
```

---

### Task 5: Desktop File Generator

**Files:**
- Create: `src/desktop.js`
- Create: `test/desktop.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// test/desktop.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateDesktop } from '../src/desktop.js'

const project = { name: 'My App', tla: 'APP', path: '/tmp/myapp', ide: 'vscode', docker: [], npm: [] }
const opts = { iconPath: '/home/user/dev-launcher/output/icons/app.svg', scriptPath: '/home/user/dev-launcher/output/scripts/app.sh' }

describe('generateDesktop', () => {
  it('includes the project name', () => {
    assert.ok(generateDesktop(project, opts).includes('Name=My App'))
  })

  it('sets Icon to the absolute icon path', () => {
    assert.ok(generateDesktop(project, opts).includes('Icon=/home/user/dev-launcher/output/icons/app.svg'))
  })

  it('sets Exec to the absolute script path', () => {
    assert.ok(generateDesktop(project, opts).includes('Exec=/home/user/dev-launcher/output/scripts/app.sh'))
  })

  it('sets Terminal=false', () => {
    assert.ok(generateDesktop(project, opts).includes('Terminal=false'))
  })

  it('sets Type=Application', () => {
    assert.ok(generateDesktop(project, opts).includes('Type=Application'))
  })

  it('includes the TLA in the Comment field', () => {
    assert.ok(generateDesktop(project, opts).includes('APP dev environment'))
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `node --test test/desktop.test.js`

Expected: errors about missing module `../src/desktop.js`

- [ ] **Step 3: Implement `src/desktop.js`**

```js
// src/desktop.js
export function generateDesktop(project, { iconPath, scriptPath }) {
  return `[Desktop Entry]
Version=1.0
Type=Application
Name=${project.name}
Comment=${project.tla} dev environment
Icon=${iconPath}
Exec=${scriptPath}
Terminal=false
Categories=Development;
`
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `node --test test/desktop.test.js`

Expected: `✓` for all 6 tests.

- [ ] **Step 5: Run the full test suite to confirm nothing is broken**

Run: `npm test`

Expected: all tests pass across all four test files.

- [ ] **Step 6: Commit**

```bash
git add src/desktop.js test/desktop.test.js
git commit -m "feat: add .desktop file generator"
```

---

### Task 6: Install Module

**Files:**
- Create: `src/install.js`

No unit tests — this module is pure filesystem side effects. It is exercised end-to-end in Task 7.

- [ ] **Step 1: Implement `src/install.js`**

```js
// src/install.js
import { mkdirSync, writeFileSync, chmodSync, symlinkSync, unlinkSync, rmSync, existsSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import { homedir } from 'node:os'

const APPLICATIONS_DIR = join(homedir(), '.local', 'share', 'applications')

export function ensureOutputDirs(outputDir) {
  mkdirSync(join(outputDir, 'icons'), { recursive: true })
  mkdirSync(join(outputDir, 'scripts'), { recursive: true })
  mkdirSync(join(outputDir, 'desktop'), { recursive: true })
  mkdirSync(APPLICATIONS_DIR, { recursive: true })
}

export function writeIcon(outputDir, tla, svgContent) {
  const filePath = join(outputDir, 'icons', `${tla.toLowerCase()}.svg`)
  writeFileSync(filePath, svgContent, 'utf8')
  return filePath
}

export function writeScript(outputDir, tla, scriptContent) {
  const filePath = join(outputDir, 'scripts', `${tla.toLowerCase()}.sh`)
  writeFileSync(filePath, scriptContent, 'utf8')
  chmodSync(filePath, 0o755)
  return filePath
}

export function writeDesktop(outputDir, tla, desktopContent) {
  const filePath = join(outputDir, 'desktop', `${tla.toLowerCase()}.desktop`)
  writeFileSync(filePath, desktopContent, 'utf8')
  return filePath
}

export function symlinkDesktop(desktopFilePath) {
  const linkPath = join(APPLICATIONS_DIR, basename(desktopFilePath))
  if (existsSync(linkPath)) unlinkSync(linkPath)
  symlinkSync(desktopFilePath, linkPath)
}

export function clean(outputDir) {
  const desktopDir = join(outputDir, 'desktop')
  if (existsSync(desktopDir)) {
    for (const file of readdirSync(desktopDir)) {
      const linkPath = join(APPLICATIONS_DIR, file)
      if (existsSync(linkPath)) unlinkSync(linkPath)
    }
  }
  if (existsSync(outputDir)) {
    rmSync(outputDir, { recursive: true, force: true })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/install.js
git commit -m "feat: add install module for file writing and symlinking"
```

---

### Task 7: Example Config and README

**Files:**
- Create: `launcher.config.example.yml`
- Create: `README.md`

- [ ] **Step 1: Write `launcher.config.example.yml`**

```yaml
# Dev Launcher Configuration
# Copy this file to launcher.config.yml and fill in your paths.
# launcher.config.yml is gitignored — your personal paths stay local.

defaults:
  ide: vscode              # vscode | idea  — can be overridden per project
  terminal: gnome-terminal

projects:
  - name: My Frontend App
    tla: MFA               # 2–4 letters shown on the dock icon
    color: "#4A90D9"       # icon background colour (any CSS hex colour)
    path: ~/code/my-frontend-app
    docker:
      - name: API Stack    # shown as the terminal window title
        command: docker-compose up
        # cwd defaults to path if omitted
    npm:
      - name: Dev Server
        command: npm run dev
      - name: Storybook
        command: npm run storybook

  - name: Backend Service
    tla: BS
    color: "#E94F37"
    path: ~/code/backend-service
    ide: idea              # overrides defaults.ide for this project
    docker:
      - command: docker-compose up
    # omit npm to skip npm terminals for this project
```

- [ ] **Step 2: Write `README.md`**

````markdown
# dev-launcher

One-click GNOME dock icons per repo. Each icon opens the correct IDE and terminal windows for that project.

## Setup

```bash
npm install
cp launcher.config.example.yml launcher.config.yml
# Edit launcher.config.yml — add your repos, paths, commands
node generate.js
```

After running, your projects appear in GNOME Activities and can be pinned to the dock.

## Usage

```bash
node generate.js                  # regenerate all projects
node generate.js --project LAP    # regenerate one project by TLA
node generate.js --clean          # remove all generated files and symlinks
```

## Config

See `launcher.config.example.yml` for a documented example.

- `launcher.config.yml` is gitignored — your paths stay local
- `output/` is gitignored — regenerate on each machine after cloning

## Requirements

- Ubuntu with GNOME
- Node.js 18+
- `gnome-terminal`
````

- [ ] **Step 3: Commit**

```bash
git add launcher.config.example.yml README.md
git commit -m "docs: add example config and README"
```

---

### Task 8: CLI Entry Point

**Files:**
- Create: `generate.js`

- [ ] **Step 1: Implement `generate.js`**

```js
#!/usr/bin/env node
// generate.js
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadConfig } from './src/config.js'
import { generateIcon } from './src/icon.js'
import { generateScript } from './src/script.js'
import { generateDesktop } from './src/desktop.js'
import { ensureOutputDirs, writeIcon, writeScript, writeDesktop, symlinkDesktop, clean } from './src/install.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = resolve(__dirname, 'output')
const CONFIG_PATH = resolve(__dirname, 'launcher.config.yml')

const args = process.argv.slice(2)
const projectFlagIdx = args.indexOf('--project')
const projectFilter = projectFlagIdx !== -1 ? args[projectFlagIdx + 1]?.toUpperCase() : null
const isClean = args.includes('--clean')

if (isClean) {
  clean(OUTPUT_DIR)
  console.log('Cleaned output/ and removed symlinks.')
  process.exit(0)
}

const config = loadConfig(CONFIG_PATH)
let projects = config.projects

if (projectFilter) {
  projects = projects.filter(p => p.tla.toUpperCase() === projectFilter)
  if (projects.length === 0) {
    console.error(`No project found with TLA: ${projectFilter}`)
    process.exit(1)
  }
}

ensureOutputDirs(OUTPUT_DIR)

for (const project of projects) {
  console.log(`Generating: ${project.name} (${project.tla})`)

  const svg = generateIcon({ tla: project.tla, color: project.color })
  const iconPath = writeIcon(OUTPUT_DIR, project.tla, svg)

  const script = generateScript(project)
  const scriptPath = writeScript(OUTPUT_DIR, project.tla, script)

  const desktop = generateDesktop(project, { iconPath, scriptPath })
  const desktopPath = writeDesktop(OUTPUT_DIR, project.tla, desktop)

  symlinkDesktop(desktopPath)

  console.log(`  ✓ Icon:    ${iconPath}`)
  console.log(`  ✓ Script:  ${scriptPath}`)
  console.log(`  ✓ Desktop: ~/.local/share/applications/${project.tla.toLowerCase()}.desktop`)
}

console.log(`\nDone! ${projects.length} project(s) generated.`)
```

- [ ] **Step 2: Smoke test with a real config**

Copy the example config (created in Task 7) and run:

```bash
cp launcher.config.example.yml launcher.config.yml
node generate.js
```

Expected output:
```
Generating: <project name> (<TLA>)
  ✓ Icon:    /home/.../output/icons/<tla>.svg
  ✓ Script:  /home/.../output/scripts/<tla>.sh
  ✓ Desktop: ~/.local/share/applications/<tla>.desktop

Done! 1 project(s) generated.
```

Then verify:
- `ls output/icons/` — `.svg` file exists
- `ls output/scripts/` — `.sh` file exists, is executable (`ls -l`)
- `ls ~/.local/share/applications/` — `.desktop` symlink exists
- Open GNOME Activities and search for the project name — it should appear

- [ ] **Step 3: Commit**

```bash
git add generate.js
git commit -m "feat: add CLI entry point"
```

---

## Done

All projects should now appear in GNOME Activities search. Right-click an icon in Activities → "Add to Favourites" to pin it to the dock.

To add a new project: edit `launcher.config.yml`, run `node generate.js --project <TLA>`.

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

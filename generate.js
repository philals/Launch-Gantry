#!/usr/bin/env node
// generate.js
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadConfig } from './src/config.js'
import { generateIcon } from './src/icon.js'
import { generateScript } from './src/script.js'
import { generateDesktop, generateGantryDesktop } from './src/desktop.js'
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

  const iconPath = project.icon ?? (() => {
    const svg = generateIcon({ tla: project.tla, color: project.color })
    return writeIcon(OUTPUT_DIR, project.tla, svg)
  })()

  const script = generateScript(project)
  const scriptPath = writeScript(OUTPUT_DIR, project.tla, script)

  const desktop = generateDesktop(project, { iconPath, scriptPath })
  const desktopPath = writeDesktop(OUTPUT_DIR, project.tla, desktop)

  symlinkDesktop(desktopPath)

  console.log(`  ✓ Icon:    ${iconPath}`)
  console.log(`  ✓ Script:  ${scriptPath}`)
  console.log(`  ✓ Desktop: ~/.local/share/applications/${project.tla.toLowerCase()}.desktop`)
}

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

console.log(`\nDone! ${projects.length} project(s) generated.`)

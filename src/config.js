// src/config.js
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
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
    shell: project.shell || defaults.shell,
    docker: (project.docker || []).map(cmd => normalizeCommand(cmd, projectPath)),
    npm: (project.npm || []).map(cmd => normalizeCommand(cmd, projectPath)),
  }
}

export function loadConfig(configPath) {
  const raw = yaml.load(readFileSync(configPath, 'utf8'))
  const configDir = dirname(resolve(configPath))
  const defaults = { ide: 'vscode', shell: 'bash', terminal: 'gnome-terminal', ...raw.defaults }
  return {
    defaults,
    projects: (raw.projects || []).map(project => normalizeProject(project, defaults, configDir)),
  }
}

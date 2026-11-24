// src/script.js
const IDE_COMMANDS = { vscode: 'code', idea: 'idea' }

export function generateScript(project) {
  const lines = ['#!/bin/bash', '[[ -f ~/.bashrc ]] && source ~/.bashrc', '']

  if (project.ide && project.ide !== 'none') {
    const ideCmd = IDE_COMMANDS[project.ide] ?? project.ide
    lines.push(`${ideCmd} "${project.path}" &`)
  }

  for (const task of project.docker) {
    lines.push(`ghostty -e bash -ic 'cd ${task.cwd} && ${task.command} || exec bash -i' &`)
  }

  for (const task of project.npm) {
    lines.push(`ghostty -e bash -ic 'cd ${task.cwd} && ${task.command}; exec bash -i' &`)
  }

  return lines.join('\n') + '\n'
}

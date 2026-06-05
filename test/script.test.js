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
    assert.ok(generateScript({ ...base, ide: 'vscode' }).includes('code "/home/user/code/myapp"'))
  })

  it('opens intellij with "idea" command', () => {
    assert.ok(generateScript({ ...base, ide: 'idea' }).includes('idea "/home/user/code/myapp"'))
  })

  it('generates no ghostty lines when docker and npm are empty', () => {
    assert.ok(!generateScript(base).includes('ghostty'))
  })

  it('runs docker commands silently without opening a terminal', () => {
    const project = {
      ...base,
      docker: [{ name: 'Stack', command: 'docker-compose up -d', cwd: '/home/user/code/myapp' }],
    }
    const script = generateScript(project)
    assert.ok(script.includes('docker-compose up -d'))
    assert.ok(!script.includes('ghostty'))
  })

  it('opens a ghostty window for each npm command', () => {
    const project = {
      ...base,
      npm: [{ name: 'Dev Server', command: 'npm run dev', cwd: '/home/user/code/myapp' }],
    }
    const script = generateScript(project)
    assert.ok(script.includes('ghostty -e bash -ic'))
    assert.ok(script.includes('npm run dev'))
  })

  it('uses bash -ic so nvm/npm are on PATH', () => {
    const project = {
      ...base,
      npm: [{ name: 'Dev', command: 'npm start', cwd: '/tmp' }],
    }
    assert.ok(generateScript(project).includes('bash -ic'))
  })

  it('keeps ghostty window open after npm command exits with exec bash -i', () => {
    const project = {
      ...base,
      npm: [{ name: 'Dev', command: 'npm start', cwd: '/tmp' }],
    }
    assert.ok(generateScript(project).includes('exec bash -i'))
  })

  it('docker has no exec bash -i — window does not linger', () => {
    const project = {
      ...base,
      docker: [{ name: 'Stack', command: 'docker-compose up -d', cwd: '/tmp' }],
    }
    assert.ok(!generateScript(project).includes('exec bash'))
  })

  it('runs all commands with & so launcher exits immediately', () => {
    const project = {
      ...base,
      npm: [{ name: 'Dev', command: 'npm run dev', cwd: '/tmp' }],
    }
    const script = generateScript(project)
    const ampersandLines = script.split('\n').filter(l => l.trimEnd().endsWith('&'))
    assert.ok(ampersandLines.length >= 2, 'IDE and ghostty lines should both end with &')
  })
})

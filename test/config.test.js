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

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

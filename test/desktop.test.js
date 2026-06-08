// test/desktop.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateDesktop, generateGantryDesktop } from '../src/desktop.js'

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

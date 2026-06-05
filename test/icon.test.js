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

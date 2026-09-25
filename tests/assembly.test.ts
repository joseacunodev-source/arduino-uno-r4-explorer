import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clamp01, idleIntensity, partProgress, positionAt } from '../src/lib/assembly.ts'

test('assembly endpoints seat parts exactly, including after user dragging', () => {
  const exploded = [-3, 2, 4] as const
  const assembled = [1, 0.1, -1] as const
  const drag = [2.1, -0.8, 1.6] as const
  assert.deepEqual(positionAt(0, [.2, .9], exploded, assembled, drag), [-.8999999999999999, 1.2, 5.6])
  assert.deepEqual(positionAt(1, [.2, .9], exploded, assembled, drag), assembled)
})

test('reverse scrolling produces exactly the same transforms at every step', () => {
  const samples = Array.from({ length: 101 }, (_, i) => i / 100)
  const sample = (p: number) => positionAt(p, [.15, .85], [-4, 3, -1], [0, .1, 0], [.5, .2, .4])
  const forward = samples.map(sample)
  const backward = [...samples].reverse().map(sample).reverse()
  assert.deepEqual(forward, backward)
})

test('parts respect staggered assembly windows without overshoot', () => {
  assert.equal(partProgress(.1, [.3, .7]), 0)
  assert.ok(Math.abs(partProgress(.5, [.3, .7]) - .5) < 1e-12)
  assert.equal(partProgress(.8, [.3, .7]), 1)
  let previous = 0
  for (let i = 0; i <= 100; i++) {
    const p = partProgress(i / 100, [.3, .7])
    assert.ok(p >= previous && p <= 1)
    previous = p
  }
})

test('idle ends before final assembly; inputs clamp safely', () => {
  assert.equal(idleIntensity(0), 1)
  assert.equal(idleIntensity(.5), 0)
  assert.equal(idleIntensity(1), 0)
  assert.equal(clamp01(-1), 0)
  assert.equal(clamp01(2), 1)
  assert.equal(clamp01(NaN), 0)
})

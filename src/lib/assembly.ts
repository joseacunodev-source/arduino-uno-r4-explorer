export type Vec3 = [number, number, number]

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
}

/** A pure, direction-independent transform. Both endpoints are exact. */
export function partProgress(progress: number, range: readonly [number, number]): number {
  const t = clamp01((clamp01(progress) - range[0]) / (range[1] - range[0]))
  return t * t * (3 - 2 * t)
}

export function positionAt(
  progress: number,
  range: readonly [number, number],
  exploded: readonly number[],
  assembled: readonly number[],
  dragOffset: readonly number[] = [0, 0, 0],
): Vec3 {
  const t = partProgress(progress, range)
  return [0, 1, 2].map((axis) => (
    (exploded[axis] + dragOffset[axis]) * (1 - t) + assembled[axis] * t
  )) as Vec3
}

export function idleIntensity(progress: number): number {
  return 1 - clamp01(progress * 2)
}

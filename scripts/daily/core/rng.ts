import { createHash } from 'node:crypto';

/**
 * Deterministic pseudo-random number generator.
 *
 * Each draw is SHA-256(seed + ":" + counter), so the sequence depends only on
 * the seed and the number of prior draws — never on wall-clock time, Math.random
 * or any external state. Running the generator twice for the same date consumes
 * the same draws in the same order and therefore produces identical output.
 */
export class Rng {
  private counter = 0;

  constructor(private readonly seedHex: string) {}

  private nextDigest(): Buffer {
    return createHash('sha256').update(`${this.seedHex}:${this.counter++}`).digest();
  }

  nextUint32(): number {
    return this.nextDigest().readUInt32BE(0);
  }

  /** Uniform float in [0, 1). */
  nextFloat(): number {
    return this.nextUint32() / 0x100000000;
  }

  /** Uniform integer in [0, maxExclusive) using rejection sampling. */
  int(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new Error(`maxExclusive must be a positive integer, got ${maxExclusive}`);
    }
    const limit = 0x100000000 - (0x100000000 % maxExclusive);
    let value = this.nextUint32();
    while (value >= limit) {
      value = this.nextUint32();
    }
    return value % maxExclusive;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('Rng.pick: cannot pick from an empty list');
    }
    const index = this.int(items.length);
    const item = items[index];
    if (item === undefined) {
      throw new Error('Rng.pick: index out of range');
    }
    return item;
  }

  /** Weighted pick. Items with weight <= 0 are excluded from selection. */
  weighted<T>(items: readonly T[], weight: (item: T) => number): T {
    const candidates = items.filter((item) => weight(item) > 0);
    if (candidates.length === 0) {
      throw new Error('Rng.weighted: no candidates with positive weight');
    }
    const total = candidates.reduce((sum, item) => sum + weight(item), 0);
    let roll = this.nextFloat() * total;
    for (const item of candidates) {
      roll -= weight(item);
      if (roll < 0) {
        return item;
      }
    }
    const last = candidates[candidates.length - 1];
    if (last === undefined) {
      throw new Error('Rng.weighted: exhausted candidates');
    }
    return last;
  }

  /** Deterministic Fisher-Yates shuffle; returns a new array. */
  shuffle<T>(items: readonly T[]): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      const a = arr[i];
      const b = arr[j];
      if (a === undefined || b === undefined) {
        throw new Error('Rng.shuffle: index out of range');
      }
      arr[i] = b;
      arr[j] = a;
    }
    return arr;
  }

  chance(probability: number): boolean {
    return this.nextFloat() < probability;
  }
}

/**
 * Derives the generation seed for a date:
 *   SHA-256("<domain>:<YYYY-MM-DD>:generator-v<major>")
 * The major version is used so a generator major bump intentionally changes
 * all future selections while historical seeds remain reconstructible.
 */
export function deriveSeed(date: string, generatorVersion: string, domain: string): string {
  const major = generatorVersion.split('.')[0] || '1';
  return createHash('sha256')
    .update(`${domain}:${date}:generator-v${major}`)
    .digest('hex');
}

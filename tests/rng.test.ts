import { describe, expect, it } from 'vitest';

import { deriveSeed, Rng } from '../scripts/daily/core/rng.js';

describe('Rng', () => {
  it('is deterministic for the same seed', () => {
    const a = new Rng('abcdef');
    const b = new Rng('abcdef');
    const seqA = Array.from({ length: 20 }, () => a.nextUint32());
    const seqB = Array.from({ length: 20 }, () => b.nextUint32());
    expect(seqA).toEqual(seqB);
  });

  it('differs across seeds', () => {
    const a = new Rng('seed-1');
    const b = new Rng('seed-2');
    expect(a.nextUint32()).not.toBe(b.nextUint32());
  });

  it('int() stays within bounds and covers the range', () => {
    const rng = new Rng('bounds');
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const value = rng.int(7);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(7);
      seen.add(value);
    }
    expect(seen.size).toBe(7);
  });

  it('pick throws on empty lists and never on populated ones', () => {
    const rng = new Rng('pick');
    expect(() => rng.pick([])).toThrow();
    expect(rng.pick(['only'])).toBe('only');
  });

  it('weighted() ignores zero-weight items', () => {
    const rng = new Rng('weighted');
    for (let i = 0; i < 100; i++) {
      const value = rng.weighted(['x', 'y', 'z'], (item) => (item === 'z' ? 0 : 1));
      expect(value).not.toBe('z');
    }
  });

  it('weighted() is deterministic', () => {
    const a = new Rng('w');
    const b = new Rng('w');
    const items = ['a', 'b', 'c'];
    const weights = [10, 20, 70];
    for (let i = 0; i < 10; i++) {
      expect(a.weighted(items, (x) => weights[items.indexOf(x)] ?? 0)).toBe(
        b.weighted(items, (x) => weights[items.indexOf(x)] ?? 0)
      );
    }
  });

  it('shuffle() is a permutation and deterministic', () => {
    const a = new Rng('shuf');
    const b = new Rng('shuf');
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const outA = a.shuffle(input);
    const outB = b.shuffle(input);
    expect(outA).toEqual(outB);
    expect([...outA].sort((x, y) => x - y)).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]); // input untouched
  });

  it('consuming draws advances the sequence (retries differ)', () => {
    const rng = new Rng('advance');
    const first = rng.nextUint32();
    const second = rng.nextUint32();
    expect(first).not.toBe(second);
  });
});

describe('deriveSeed', () => {
  it('follows the documented derivation scheme', () => {
    // SHA-256("DailyQuest:2026-10-07:generator-v1")
    const { createHash } = require('node:crypto') as typeof import('node:crypto');
    const expected = createHash('sha256').update('DailyQuest:2026-10-07:generator-v1').digest('hex');
    expect(deriveSeed('2026-10-07', '1.0.0', 'DailyQuest')).toBe(expected);
  });

  it('uses only the major version', () => {
    expect(deriveSeed('2026-10-07', '1.2.3', 'DailyQuest')).toBe(
      deriveSeed('2026-10-07', '1.9.9', 'DailyQuest')
    );
    expect(deriveSeed('2026-10-07', '1.0.0', 'DailyQuest')).not.toBe(
      deriveSeed('2026-10-07', '2.0.0', 'DailyQuest')
    );
  });

  it('differs per date', () => {
    expect(deriveSeed('2026-10-07', '1.0.0', 'DailyQuest')).not.toBe(
      deriveSeed('2026-10-08', '1.0.0', 'DailyQuest')
    );
  });
});

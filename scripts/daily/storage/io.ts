import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Deterministic JSON I/O with atomic writes.
 *
 * All generated files are written with 2-space indentation, stable key order
 * (insertion order of the constructed object) and a trailing newline, so
 * identical logical content always produces byte-identical files — a hard
 * requirement for the idempotency guarantee.
 */

export function readJsonFile<T>(path: string): T {
  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch (error) {
    throw new Error(`Cannot read ${path}: ${(error as Error).message}`);
  }
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new Error(`Invalid JSON in ${path}: ${(error as Error).message}`);
  }
}

export function fileExists(path: string): boolean {
  return existsSync(path);
}

export function serializeJson(data: unknown): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

/**
 * Writes via a temp file + rename so a crash never leaves a half-written
 * JSON file in the archive.
 */
export function writeJsonAtomic(path: string, data: unknown): void {
  const tmp = `${path}.tmp`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(tmp, serializeJson(data), 'utf8');
  renameSync(tmp, path);
}

export function writeFileAtomic(path: string, content: string): void {
  const tmp = `${path}.tmp`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(tmp, content, 'utf8');
  renameSync(tmp, path);
}

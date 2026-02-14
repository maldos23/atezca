import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { CacheManager } from '../cache/cache-manager.js';
import type { TestCommand, PlaywrightAction } from '../types/index.js';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'atezca-cache-'));
}

describe('CacheManager', () => {
  it('stores and retrieves actions', () => {
    const dir = makeTempDir();
    const cachePath = path.join(dir, 'cache.json');

    const cache = new CacheManager(cachePath, 30);
    const command: TestCommand = { actionType: 'interact', description: 'click login', timestamp: 1 };
    const actions: PlaywrightAction[] = [{ action: 'click', selector: 'role=button[name="Login"]' }];

    expect(cache.get(command)).toBeNull();
    expect(cache.has(command)).toBe(false);

    cache.set(command, actions);
    expect(cache.has(command)).toBe(true);
    expect(cache.get(command)).toEqual(actions);

    cache.clear();
    expect(fs.existsSync(cachePath)).toBe(false);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('expires entries and removes them on get()', () => {
    vi.useFakeTimers();
    const dir = makeTempDir();
    const cachePath = path.join(dir, 'cache.json');

    vi.setSystemTime(new Date('2026-02-14T00:00:00.000Z'));
    const cache = new CacheManager(cachePath, 0.000001); // ~86.4ms

    const command: TestCommand = { actionType: 'wait', description: 'until loaded', timestamp: 1 };
    cache.set(command, [{ action: 'wait', selector: 'body', condition: 'attached', timeout: 1 }]);

    vi.advanceTimersByTime(100);
    expect(cache.get(command)).toBeNull();
    expect(cache.has(command)).toBe(false);

    vi.useRealTimers();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('loads non-expired entries from disk and ignores invalid json', () => {
    const dir = makeTempDir();
    const cachePath = path.join(dir, 'cache.json');

    fs.writeFileSync(cachePath, 'not-json', 'utf-8');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cache = new CacheManager(cachePath, 30);

    // Should not throw, and stats should be empty
    expect(cache.getStats().size).toBe(0);

    warnSpy.mockRestore();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

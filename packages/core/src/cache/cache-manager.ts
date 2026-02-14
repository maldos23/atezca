import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import type { CacheEntry, PlaywrightAction, TestCommand } from '../types/index.js';

/**
 * Cache manager for storing interpreted commands
 */
export class CacheManager {
  private cacheFilePath: string;
  private expiryDays: number;
  private cache: Map<string, CacheEntry>;

  constructor(cacheFilePath: string = '.atezca-cache.json', expiryDays: number = 30) {
    this.cacheFilePath = cacheFilePath;
    this.expiryDays = expiryDays;
    this.cache = new Map();
    this.load();
  }

  /**
   * Generate cache key from command
   */
  private generateKey(command: TestCommand): string {
    const data = `${command.actionType}:${command.description}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Load cache from file
   */
  private load(): void {
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        const data = fs.readFileSync(this.cacheFilePath, 'utf-8');
        const entries = JSON.parse(data) as CacheEntry[];
        
        // Load non-expired entries
        for (const entry of entries) {
          if (!this.isExpired(entry)) {
            this.cache.set(entry.key, entry);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load cache, starting with empty cache');
      this.cache.clear();
    }
  }

  /**
   * Save cache to file
   */
  private save(): void {
    try {
      const entries = Array.from(this.cache.values());
      const data = JSON.stringify(entries, null, 2);
      fs.writeFileSync(this.cacheFilePath, data, 'utf-8');
    } catch (error) {
      console.warn('Failed to save cache:', error);
    }
  }

  /**
   * Get cached actions for a command
   */
  get(command: TestCommand): PlaywrightAction[] | null {
    const key = this.generateKey(command);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.save();
      return null;
    }

    return entry.actions;
  }

  /**
   * Store actions in cache
   */
  set(command: TestCommand, actions: PlaywrightAction[]): void {
    const key = this.generateKey(command);
    const now = Date.now();
    const expiryMs = this.expiryDays * 24 * 60 * 60 * 1000;

    const entry: CacheEntry = {
      key,
      actions,
      cachedAt: now,
      expiresAt: now + expiryMs,
    };

    this.cache.set(key, entry);
    this.save();
  }

  /**
   * Check if command is cached
   */
  has(command: TestCommand): boolean {
    return this.get(command) !== null;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    if (fs.existsSync(this.cacheFilePath)) {
      fs.unlinkSync(this.cacheFilePath);
    }
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    if (keysToDelete.length > 0) {
      this.save();
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; oldestEntry: number | null; newestEntry: number | null } {
    const entries = Array.from(this.cache.values());
    
    if (entries.length === 0) {
      return { size: 0, oldestEntry: null, newestEntry: null };
    }

    const timestamps = entries.map(e => e.cachedAt);
    
    return {
      size: entries.length,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps),
    };
  }
}

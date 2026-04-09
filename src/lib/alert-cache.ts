import { InfrastructureAlert } from './types';
import fs from 'fs';
import path from 'path';

/**
 * Server-side alert cache with a configurable TTL and disk persistence.
 *
 * How it works:
 *  1. `get()` returns cached data if fresh (within TTL).
 *  2. If stale, it calls the upstream fetcher and refreshes the cache.
 *  3. If the fetcher throws (API down), it returns stale data rather than failing.
 *  4. On startup, if the in-memory cache is empty it loads from a JSON file on disk,
 *     so the app survives restarts and cold starts with the last-known-good data.
 *
 * Usage:
 *   const cache = new AlertCache(fetchFromUpstream, { ttlMs: 30 * 60 * 1000 });
 *   const alerts = await cache.get();
 */

interface CacheEntry {
  alerts: InfrastructureAlert[];
  fetchedAt: number; // epoch ms
}

interface AlertCacheOptions {
  /** Time-to-live in milliseconds. Default: 30 minutes. */
  ttlMs?: number;
  /** Path for the on-disk JSON fallback. Default: .cache/alerts.json relative to cwd. */
  diskPath?: string;
}

const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes
const DEFAULT_DISK_PATH = path.join(process.cwd(), '.cache', 'alerts.json');

export class AlertCache {
  private entry: CacheEntry | null = null;
  private fetcher: () => Promise<InfrastructureAlert[]>;
  private ttlMs: number;
  private diskPath: string;
  private refreshPromise: Promise<InfrastructureAlert[]> | null = null;

  constructor(
    fetcher: () => Promise<InfrastructureAlert[]>,
    options: AlertCacheOptions = {}
  ) {
    this.fetcher = fetcher;
    this.ttlMs = options.ttlMs ?? DEFAULT_TTL;
    this.diskPath = options.diskPath ?? DEFAULT_DISK_PATH;
  }

  /** Return cached alerts, refreshing if stale. Never throws if stale data exists. */
  async get(): Promise<InfrastructureAlert[]> {
    // 1. If in-memory cache is fresh, return it immediately
    if (this.entry && Date.now() - this.entry.fetchedAt < this.ttlMs) {
      return this.entry.alerts;
    }

    // 2. Try to load from disk if we have nothing in memory
    if (!this.entry) {
      this.loadFromDisk();
    }

    // 3. Attempt a refresh (deduplicated so concurrent requests share one fetch)
    try {
      const alerts = await this.refresh();
      return alerts;
    } catch (error) {
      console.error('[AlertCache] Upstream fetch failed, serving stale cache:', error);
      // 4. If refresh fails but we have stale data (memory or disk), use it
      if (this.entry) {
        return this.entry.alerts;
      }
      // 5. Nothing cached at all — rethrow so the caller knows
      throw error;
    }
  }

  /** Force a refresh regardless of TTL. Returns the fresh data. */
  async refresh(): Promise<InfrastructureAlert[]> {
    // Deduplicate concurrent refresh calls
    if (!this.refreshPromise) {
      this.refreshPromise = this.doRefresh();
    }
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  /** Get cache metadata for diagnostics. */
  status(): { cached: boolean; fetchedAt: number | null; age: number | null; stale: boolean } {
    if (!this.entry) {
      return { cached: false, fetchedAt: null, age: null, stale: true };
    }
    const age = Date.now() - this.entry.fetchedAt;
    return {
      cached: true,
      fetchedAt: this.entry.fetchedAt,
      age,
      stale: age >= this.ttlMs,
    };
  }

  private async doRefresh(): Promise<InfrastructureAlert[]> {
    const alerts = await this.fetcher();
    this.entry = { alerts, fetchedAt: Date.now() };
    this.saveToDisk();
    return alerts;
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.diskPath)) {
        const raw = fs.readFileSync(this.diskPath, 'utf-8');
        const data = JSON.parse(raw) as CacheEntry;
        if (data.alerts && data.fetchedAt) {
          this.entry = data;
          console.log(
            `[AlertCache] Loaded ${data.alerts.length} alerts from disk (age: ${Math.round((Date.now() - data.fetchedAt) / 60000)}m)`
          );
        }
      }
    } catch (error) {
      console.error('[AlertCache] Failed to load disk cache:', error);
    }
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.diskPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.diskPath, JSON.stringify(this.entry), 'utf-8');
    } catch (error) {
      console.error('[AlertCache] Failed to write disk cache:', error);
    }
  }
}

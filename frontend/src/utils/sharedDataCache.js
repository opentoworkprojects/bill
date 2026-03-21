/**
 * Shared data cache — deduplicates concurrent fetches for shared read-only data.
 *
 * Problem: Every page/tab independently fetches /menu and /business/settings on mount.
 * With multiple tabs or components, this creates a request flood that hits rate limits.
 *
 * Solution: Module-level in-flight deduplication + localStorage persistence.
 * - If a fetch is already in-flight, all callers await the same promise.
 * - Cached results are stored in localStorage and reused for `ttl` ms.
 * - On fresh module import (page navigation), localStorage cache is checked first.
 */

import { API } from '../App';
import { apiWithRetry } from './apiClient';

const _inflight = new Map(); // key -> Promise

const LS_PREFIX = 'sharedCache:';

function _lsGet(key) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() < entry.expiresAt) return entry.data;
    localStorage.removeItem(LS_PREFIX + key);
  } catch {
    // ignore parse errors
  }
  return null;
}

function _lsSet(key, data, ttl) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify({ data, expiresAt: Date.now() + ttl }));
  } catch {
    // ignore quota errors
  }
}

/**
 * Fetch shared data with deduplication and TTL caching.
 *
 * @param {string} key   - Cache key (e.g. 'menu', 'business/settings')
 * @param {string} url   - Full URL to fetch
 * @param {number} ttl   - Cache TTL in ms (default 60s)
 */
export async function fetchShared(key, url, ttl = 60_000) {
  // Return localStorage-persisted value if still fresh
  const cached = _lsGet(key);
  if (cached !== null) {
    return cached;
  }

  // Deduplicate: if a fetch is already in-flight, await it
  if (_inflight.has(key)) {
    return _inflight.get(key);
  }

  // Start a new fetch
  const promise = apiWithRetry({ method: 'get', url, timeout: 10000 })
    .then(res => {
      _lsSet(key, res.data, ttl);
      return res.data;
    })
    .finally(() => {
      _inflight.delete(key);
    });

  _inflight.set(key, promise);
  return promise;
}

/** Invalidate a cached entry (e.g. after a settings update) */
export function invalidateShared(key) {
  try { localStorage.removeItem(LS_PREFIX + key); } catch { /* ignore */ }
}

/** Convenience wrappers */
export const fetchMenu = (fresh = false) => {
  if (fresh) invalidateShared('menu');
  return fetchShared(
    'menu',
    `${API}/menu`,
    60_000
  );
};

export const fetchBusinessSettings = () =>
  fetchShared('business/settings', `${API}/business/settings`, 120_000);

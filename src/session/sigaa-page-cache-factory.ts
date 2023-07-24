import { PageCache, SigaaPageCache } from './sigaa-page-cache';

/**
 * Responsible for creating a cache instance
 * @category Internal
 */
export interface PageCacheFactory {
  createPageCache(timeoutCache?: number): PageCache;
}

/**
 * Responsible for creating a cache instance
 * @category Internal
 */
export class SigaaPageCacheFactory implements PageCacheFactory {
  createPageCache(timeoutCache?: number): PageCache {
    return new SigaaPageCache(timeoutCache);
  }
}

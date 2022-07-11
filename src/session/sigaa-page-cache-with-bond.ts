import { HTTPRequestOptions } from './sigaa-http';
import { Page } from './sigaa-page';
import { PageCache } from './sigaa-page-cache';
import { PageCacheFactory } from './sigaa-page-cache-factory';

/**
 * @category Internal
 */
export interface PageCacheWithBond extends PageCache {
  /**
   *Define the current bond, each bond has its own cache
   */
  setCurrentBond(bondSwitchUrl: URL | null): void;
}

/**
 * Transforms the cache mechanism to be dependent on the current bond.
 * @category Internal
 */
export class SigaaPageCacheWithBond implements PageCacheWithBond {
  /**
   * List of all cache instances.
   */
  private cacheInstances = new Map<string | null, PageCache>();

  /**
   * Cache for the current bond
   */
  private currentCache: PageCache;

  /**
   * Current bond
   */
  private currentBond: null | string = null;

  constructor(
    private cachePageFactory: PageCacheFactory,
    private timeoutCache?: number
  ) {
    this.currentCache = this.cachePageFactory.createPageCache(timeoutCache);
    this.cacheInstances.set(null, this.currentCache);
  }

  /**
   * @inheritdoc
   */
  setCurrentBond(bondSwitchURL: URL | null): void {
    const bondSwitchURLstring = bondSwitchURL ? bondSwitchURL.href : null;
    if (bondSwitchURLstring !== this.currentBond) {
      const oldCacheInstance = this.cacheInstances.get(bondSwitchURLstring);
      if (oldCacheInstance) {
        this.currentCache = oldCacheInstance;
      } else {
        const newCacheInstance = this.cachePageFactory.createPageCache(
          this.timeoutCache
        );
        this.cacheInstances.set(bondSwitchURLstring, newCacheInstance);
        this.currentCache = newCacheInstance;
      }
      this.currentBond = bondSwitchURLstring;
    }
  }

  /**
   * @inheritdoc
   */
  getPage(
    httpOptions: HTTPRequestOptions,
    body?: string | Buffer
  ): Page | undefined {
    return this.currentCache.getPage(httpOptions, body);
  }

  /**
   * @inheritdoc
   */
  storePage(page: Page): void {
    return this.currentCache.storePage(page);
  }

  /**
   * @inheritdoc
   */
  clearCachePage(): void {
    for (const cacheInstance of this.cacheInstances.values()) {
      cacheInstance.clearCachePage();
    }
    this.cacheInstances.clear();
  }
}

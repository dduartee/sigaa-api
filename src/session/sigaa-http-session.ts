import { isEqual } from 'lodash';
import { RequestStacks } from '@helpers/sigaa-request-stack';
import {
  HTTPRequestOptions,
  ProgressCallback,
  SigaaRequestOptions
} from './sigaa-http';
import { Page, SigaaPage } from './sigaa-page';
import { PageCache } from './sigaa-page-cache';
import { CookiesController } from './sigaa-cookies-controller';
import { RequestStackController } from '../helpers/sigaa-request-stack';
import { InstitutionController } from './sigaa-institution-controller';

/**
 * Manage a http session
 * @category Internal
 */
export interface HTTPSession {
  institutionController: InstitutionController;
  /**
   * if returns string the download is suspended
   * @param url
   * @param sessionHttpOptions
   * @param requestBody
   */
  beforeDownloadRequest(
    url: URL,
    downloadPath: string,
    sessionHttpOptions: HTTPRequestOptions,
    bodyRequest?: string,
    callback?: ProgressCallback
  ): Promise<string | null>;

  afterDownloadRequest(
    url: URL,
    downloadPath: string,
    sessionHttpOptions: HTTPRequestOptions,
    finalPath: string,
    bodyRequest?: string,
    callback?: ProgressCallback
  ): Promise<string>;

  /**
   * it is called after a sigaa response, only if successful. Should return a page or throw an error.
   * @param page Sigaa page
   * @param options Request Options
   */
  afterSuccessfulRequest(
    page: Page,
    options?: SigaaRequestOptions
  ): Promise<Page>;

  /**
   * It is called after a error in request. You must return a page or throw an error.
   * @param page Sigaa page
   * @param options Request Options
   */
  afterUnsuccessfulRequest(
    err: Error,
    httpOptions: HTTPRequestOptions,
    body?: string | Buffer
  ): Promise<Page>;

  /**
   * Transforms a path in URL
   * @param path
   */
  getURL(path: string): URL;

  /**
   * It is called before the request, it may be useful to delay.
   * If you return a page, the answer will be the page and there will be no http request
   * If it returns null, the request will continue as normal and if you want to suspend the request, it may generate an error.
   * @param link
   * @param httpOptions
   * @param body
   * @param options
   */
  beforeRequest(
    link: URL,
    httpOptions: HTTPRequestOptions,
    body?: string | Buffer,
    options?: SigaaRequestOptions
  ): Promise<Page | null>;

  /**
   * This is called to modify the request options
   * TIP: You must at least insert the cookies.
   * @param link
   * @param httpOptions
   * @param body
   * @param options
   */
  afterHTTPOptions(
    link: URL,
    httpOptions: HTTPRequestOptions,
    body?: string | Buffer,
    options?: SigaaRequestOptions
  ): Promise<HTTPRequestOptions>;

  /**
   *  Flush all cookies and cache of session
   */
  close(): void;
}

/**
 * Interface for request params
 * @category Internal
 */
export interface Request {
  httpOptions: HTTPRequestOptions;
  body?: string | Buffer;
}

/**
 * Interface to join beforeRequest and afterRequest
 * @category Internal
 */
export interface RequestPromiseTracker {
  request: Request;
  resolve(page: Page): void;
  reject(err: Error): void;
}

/**
 * @category Internal
 */
export class SigaaHTTPSession implements HTTPSession {
  /**
   */

  constructor(
    public institutionController: InstitutionController,
    private cookiesController: CookiesController,
    private pageCache: PageCache,
    private requestStack: RequestStackController<Request, Page>
  ) {}

  /**
   * @inheritdoc
   */
  async afterDownloadRequest(
    url: URL,
    downloadPath: string,
    sessionHttpOptions: HTTPRequestOptions,
    finalPath: string
  ): Promise<string> {
    return finalPath;
  }

  /**
   * @inheritdoc
   */
  async beforeDownloadRequest(): Promise<null> {
    return null;
  }

  get requestStacks(): RequestStacks<Request, Page> {
    return this.requestStack.getStacksByDomain(
      this.institutionController.url.href
    );
  }

  private requestPromises: RequestPromiseTracker[] = [];

  /**
   * @inheritdoc
   */
  getURL(path: string): URL {
    return new URL(path, this.institutionController.url.href);
  }

  /**
   * @inheritdoc
   */
  async afterUnsuccessfulRequest(
    err: Error,
    httpOptions: HTTPRequestOptions,
    body?: string | Buffer
  ): Promise<Page> {
    const requestPromise = this.findAndRemovePromiseRequest({
      httpOptions,
      body
    });
    if (requestPromise) {
      requestPromise.reject(err);
    }
    throw err;
  }

  /**
   * @inheritdoc
   */
  private findAndRemovePromiseRequest(
    request: Request
  ): RequestPromiseTracker | null {
    const index = this.requestPromises.findIndex(
      (requestPromise) =>
        isEqual(request.httpOptions, requestPromise.request.httpOptions) &&
        requestPromise.request.body === request.body
    );
    if (index !== -1) {
      return this.requestPromises.splice(index, 1)[0];
    }
    return null;
  }

  /**
   * @inheritdoc
   */
  async afterSuccessfulRequest(page: SigaaPage): Promise<Page> {
    const requestPromise = this.findAndRemovePromiseRequest({
      body: page.requestBody,
      httpOptions: page.requestOptions
    });
    const setCookie = page.headers['set-cookie'];
    if (setCookie) {
      const cookies = typeof setCookie === 'string' ? [setCookie] : setCookie;

      this.cookiesController.storeCookies(
        page.requestOptions.hostname,
        cookies
      );
    }
    if (page.statusCode === 200) {
      if (
        page.requestBody === undefined ||
        typeof page.requestBody === 'string'
      )
        this.pageCache.storePage(page);
    }

    if (requestPromise) {
      requestPromise.resolve(page);
    }

    return page;
  }

  /**
   * @inheritdoc
   */
  async afterHTTPOptions(
    link: URL,
    httpOptions: HTTPRequestOptions
  ): Promise<HTTPRequestOptions> {
    const cookie = this.cookiesController.getCookieHeader(
      link.hostname,
      link.pathname
    );
    if (cookie) {
      httpOptions.headers.Cookie = cookie;
    }
    return httpOptions;
  }

  /**
   * @inheritdoc
   */
  async beforeRequest(
    url: URL,
    httpOptions: HTTPRequestOptions,
    requestBody?: string | Buffer,
    options?: SigaaRequestOptions
  ): Promise<Page | null> {
    if (!options?.noCache) {
      const page = this.pageCache.getPage(httpOptions, requestBody);
      if (page) return page;
    }

    const stack = !httpOptions.headers.Cookie
      ? this.requestStacks.noCookie
      : httpOptions.method === 'POST'
      ? this.requestStacks.post
      : this.requestStacks.get;

    const request: Request = {
      httpOptions,
      body: requestBody
    };
    if (
      (requestBody === undefined || typeof requestBody == 'string') &&
      options?.shareSameRequest
    ) {
      const runningRequest = stack.promises.find(
        (request) =>
          request.key.body === requestBody &&
          isEqual(httpOptions, request.key.httpOptions)
      );
      if (runningRequest?.promise) {
        return runningRequest.promise;
      }
    }
    await new Promise<void>((awaitResolve) => {
      stack.addPromise(request, () => {
        awaitResolve();
        return new Promise<Page>((resolve, reject) => {
          this.requestPromises.push({ request, resolve, reject });
        });
      });
    });

    return null;
  }

  /**
   * @inheritdoc
   */
  close(): void {
    this.cookiesController.clearCookies();
    this.pageCache.clearCachePage();
  }
}

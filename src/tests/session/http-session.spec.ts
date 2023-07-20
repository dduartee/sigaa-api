import { Request, SigaaHTTPSession } from '@session/sigaa-http-session';
import { SigaaHTTP } from '@session/sigaa-http';
import { SigaaPageCache } from '@session/sigaa-page-cache';
import { SigaaCookiesController } from '@session/sigaa-cookies-controller';
import { SigaaRequestStack } from '@helpers/sigaa-request-stack';
import { SigaaInstitutionController } from '@session/sigaa-institution-controller';
import { Page } from '@session/sigaa-page';
import { SigaaPageIFSC } from '@session/page/sigaa-page-ifsc';

const createHTTPInstance = () => {
  const sigaaCookiesController = new SigaaCookiesController();
  const pageCache = new SigaaPageCache();
  const requestStackController = new SigaaRequestStack<Request, Page>();
  const institutionController = new SigaaInstitutionController('IFSC', 'https://sigaa.ifsc.edu.br')
  const httpSession = new SigaaHTTPSession(
    institutionController,
    sigaaCookiesController,
    pageCache,
    requestStackController
  );
  return { http: new SigaaHTTP(httpSession), httpSession: httpSession };
};

test('if Sigaa http returns a page', async () => {
  const http = createHTTPInstance();
  const page = await http.http.get('/');

  expect(page).toBeInstanceOf(SigaaPageIFSC);

  http.httpSession.close();
}, 30000);

test('if Sigaa http send cookies', async () => {
  const http = createHTTPInstance();
  await http.http.get('/sigaa/public/home.jsf'); // request toget cookie
  const page = await http.http.get('/sigaa/public/home.jsf');

  expect(typeof page.requestHeaders['Cookie']).toBe('string');

  http.httpSession.close();
}, 30000);

test('if Sigaa http requests again if cookies change', async () => {
  const http = createHTTPInstance();

  const firstRequest = await http.http.get('/sigaa/public/home.jsf'); // Loads cookies
  expect(firstRequest.headers['set-cookie']).toBeTruthy();
  const secondRequest = await http.http.get('/sigaa/public/home.jsf');

  expect(firstRequest === secondRequest).toBeFalsy();

  http.httpSession.close();
}, 10000);

test('if Sigaa http requests again if noCache is enable', async () => {
  const http = createHTTPInstance();
  await http.http.get('/sigaa/public/home.jsf'); // request to get cookies

  const firstRequest = await http.http.get('/sigaa/public/home.jsf'); // Loads cookies
  const secondRequest = await http.http.get('/sigaa/public/home.jsf', {
    noCache: true
  });

  expect(firstRequest !== secondRequest).toBeTruthy();

  http.httpSession.close();
}, 10000);

test('if Sigaa http cache page', async () => {
  const http = createHTTPInstance();
  await http.http.get('/sigaa/public/home.jsf'); // request to get cookies

  const firstRequest = await http.http.get('/sigaa/public/home.jsf'); // Loads cookies
  const secondRequest = await http.http.get('/sigaa/public/home.jsf'); // Loads cookies

  expect(firstRequest === secondRequest).toBeTruthy();

  http.httpSession.close();
}, 10000);

test('if Sigaa http return page same request', async () => {
  const http = createHTTPInstance();

  const firstRequest = http.http.get('/sigaa/public/home.jsf', {
    shareSameRequest: true
  });

  const secondRequest = http.http.get('/sigaa/public/home.jsf', {
    shareSameRequest: true
  });

  expect((await firstRequest) === (await secondRequest)).toBeTruthy();

  http.httpSession.close();
}, 10000);



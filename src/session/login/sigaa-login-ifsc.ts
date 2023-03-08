import { LoginStatus } from '../../sigaa-types';
import { URL } from 'url';
import { HTTP } from '../sigaa-http';
import { Page, SigaaForm } from '../sigaa-page';
import { Session } from '../sigaa-session';
import { Login } from './sigaa-login';

/**
 * Responsible for logging in IFSC.
 * @category Internal
 */
export class SigaaLoginIFSC implements Login {
  constructor(protected http: HTTP, protected session: Session) {}
  readonly errorInvalidCredentials = 'SIGAA: Invalid credentials.';

  protected parseMobileLoginForm(
    page: Page,
    username: string,
    password: string
  ): SigaaForm {
    const formElement = page.$('#form-login');

    const actionUrl = formElement.attr('action');
    if (!actionUrl) throw new Error('SIGAA: No action form on login page.');

    const action = new URL(actionUrl, page.url.href);

    const postValues: Record<string, string> = {};

    let hasInputPassword = false;
    let hasInputText = false;
    const inputs = formElement.find('input').toArray();

    for (const element of inputs) {
      const type = page.$(element).attr('type');
      const name = page.$(element).attr('name');
      if (!name) continue;

      if (type === 'password') {
        if (hasInputPassword)
          throw new Error('SIGAA: More than one password input on login form.');
        hasInputPassword = true;
        postValues[name] = password;
      } else if (type === 'text') {
        if (hasInputText)
          throw new Error('SIGAA: More than one text input on login form.');
        hasInputText = true;
        postValues[name] = username;
      } else {
        postValues[name] = page.$(element).val();
      }
    }

    return { action, postValues };
  }
  /**
   * Current login form.
   */
  protected formPage?: Page;

  async getMobileLoginForm(
    username: string,
    password: string
  ): Promise<SigaaForm> {
    if (this.formPage) {
      return this.parseMobileLoginForm(this.formPage, username, password);
    } else {
      const page = await this.http.get('/sigaa/mobile/touch/login.jsf', {
        mobile: true
      });
      return this.parseMobileLoginForm(page, username, password);
    }
  }

  protected async mobileLogin(
    username: string,
    password: string
  ): Promise<Page> {
    const { action, postValues } = await this.getMobileLoginForm(
      username,
      password
    );
    const page = await this.http.post(action.href, postValues);
    return await this.parseMobileLoginResult(page);
  }
  /**
   * Start a session on Sigaa, return login reponse page
   * @param username
   * @param password
   */
  async login(username: string, password: string, retry = true): Promise<Page> {
    if (this.session.loginStatus === LoginStatus.Authenticated)
      throw new Error('SIGAA: This session already has a user logged in.');
    try {
      await this.mobileLogin(username, password);
      const jumpPage = await this.http.get('/sigaa/paginaInicial.do'); // página para iniciar a sequência de redirecionamento para o discente.jsf
      return this.http.followAllRedirect(jumpPage);
    } catch (error) {
      if (!retry || error.message === this.errorInvalidCredentials) {
        throw error;
      } else {
        return this.login(username, password, false);
      }
    }
  }

  protected async parseMobileLoginResult(page: Page): Promise<Page> {
    const accountPage = await this.http.followAllRedirect(page);
    if (accountPage.bodyDecoded.includes('form-login')) {
      if (accountPage.bodyDecoded.includes('Usuário e/ou senha inválidos')) {
        this.formPage = accountPage;
        throw new Error(this.errorInvalidCredentials);
      } else {
        throw new Error('SIGAA: Invalid response after login attempt.');
      }
    } else {
      this.session.loginStatus = LoginStatus.Authenticated;
      return accountPage;
    }
  }
}

import { LoginStatus } from '../../sigaa-types';

import { HTTP } from '../sigaa-http';
import { Session } from '../sigaa-session';
import { Login } from './sigaa-login';
import { IFSCPage } from '@session/page/sigaa-page-ifsc';
import { SigaaForm } from '@session/sigaa-page';

/**
 * Responsible for logging in IFSC.
 * @category Internal
 */
export class SigaaLoginIFSC implements Login {
  constructor(protected http: HTTP, protected session: Session) {}
  readonly errorInvalidCredentials = 'SIGAA: Invalid credentials.';

  protected parseLoginForm(page: IFSCPage): SigaaForm {
    const formElement = page.$("form[name='loginForm']");

    const actionUrl = formElement.attr('action');
    if (!actionUrl) throw new Error('SIGAA: No action form on login page.');

    const action = new URL(actionUrl, page.url.href);

    const postValues: Record<string, string> = {};

    formElement.find('input').each((index, element) => {
      const name = page.$(element).attr('name');
      if (name) postValues[name] = page.$(element).val();
    });

    return { action, postValues };
  }

  /**
   * Current login form.
   */
  protected form?: SigaaForm;

  /**
   * Retuns HTML form
   */
  async getLoginForm(): Promise<SigaaForm> {
    if (this.form) {
      return this.form;
    } else {
      const page = await this.http.get('/sigaa/verTelaLogin.do');
      return this.parseLoginForm(page);
    }
  }

  /**
   * Start a session on desktop
   * @param username
   * @param password
   */
  protected async desktopLogin(
    username: string,
    password: string
  ): Promise<IFSCPage> {
    const { action, postValues } = await this.getLoginForm();

    postValues['user.login'] = username;
    postValues['user.senha'] = password;
    const page = await this.http.post(action.href, postValues);
    return await this.parseDesktopLoginResult(page);
  }

  /**
   * Start a session on Sigaa, return login reponse page
   * @param username
   * @param password
   */
  async login(
    username: string,
    password: string,
    retry = true
  ): Promise<IFSCPage> {
    throw new Error('SIGAA: This login method is no longer supported by the IFSC, instead use login via the JSESSIONID cookie, see example...');
    if (this.session.loginStatus === LoginStatus.Authenticated)
      throw new Error('SIGAA: This session already has a user logged in.');
    try {
      const page = await this.desktopLogin(username, password);
      return this.http.followAllRedirect(page);
    } catch (error) {
      if (!retry || error.message === this.errorInvalidCredentials) {
        throw error;
      } else {
        return this.login(username, password, false);
      }
    }
  }

  protected async parseDesktopLoginResult(page: IFSCPage): Promise<IFSCPage> {
    const accountPage = await this.http.followAllRedirect(page);
    if (accountPage.bodyDecoded.includes('Entrar no Sistema')) {
      if (accountPage.bodyDecoded.includes('Usuário e/ou senha inválidos')) {
        this.form = await this.parseLoginForm(accountPage);
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

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
  protected async parseLoginForm(
    page: Page,
    recaptchaSolver: (siteKey: string, dataAction: string) => Promise<string>
  ): Promise<SigaaForm> {
    const formElement = page.$("form[name='loginForm']");

    const actionUrl = formElement.attr('action');
    if (!actionUrl) throw new Error('SIGAA: No action form on login page.');

    const action = new URL(actionUrl, page.url.href);

    const postValues: Record<string, string> = {};

    formElement.find('input').each((index, element) => {
      const name = page.$(element).attr('name');
      if (name) postValues[name] = page.$(element).val();
    });

    const recaptchaResponse = await this.getRecaptchaResponse(
      page,
      recaptchaSolver
    );
    postValues['g-recaptcha-response'] = recaptchaResponse;

    return { action, postValues };
  }
  /**
   * Current login form.
   */
  protected formPage?: Page;

  private async getRecaptchaResponse(
    page: Page,
    recaptchaSolver: (siteKey: string, dataAction: string) => Promise<string>
  ) {
    const recaptchaButton = page.$('.g-recaptcha');
    const siteKey = recaptchaButton.attr('data-sitekey');
    const dataAction = recaptchaButton.attr('data-action');
    if (!siteKey || !dataAction)
      throw new Error('SIGAA: Could not parse recaptcha data.');

    const recaptchaResponse = await recaptchaSolver(siteKey, dataAction);
    return recaptchaResponse;
  }

  async getLoginForm(
    recaptchaSolver: (siteKey: string, dataAction: string) => Promise<string>
  ): Promise<SigaaForm> {
    if (this.formPage) {
      return this.parseLoginForm(this.formPage, recaptchaSolver);
    } else {
      const page = await this.http.get('/sigaa/verTelaLogin.do');
      return this.parseLoginForm(page, recaptchaSolver);
    }
  }

  protected async desktopLogin(
    username: string,
    password: string,
    recaptchaSolver: (siteKey: string, dataAction: string) => Promise<string>
  ): Promise<Page> {
    const { action, postValues } = await this.getLoginForm(recaptchaSolver);
    postValues['user.login'] = username;
    postValues['user.senha'] = password;
    const page = await this.http.post(action.href, postValues);
    return await this.parseLoginResult(page);
  }
  /**
   * Start a session on Sigaa, return login reponse page
   * @param username
   * @param password
   */
  async login(
    username: string,
    password: string,
    recaptchaSolver: (siteKey: string, dataAction: string) => Promise<string>,
    retry = true
  ): Promise<Page> {
    if (this.session.loginStatus === LoginStatus.Authenticated)
      throw new Error('SIGAA: This session already has a user logged in.');
    try {
      const page = await this.desktopLogin(username, password, recaptchaSolver);
      return this.http.followAllRedirect(page);
    } catch (error) {
      if (!retry || error.message === this.errorInvalidCredentials) {
        throw error;
      } else {
        console.log('SIGAA: Retrying login...');
        return this.login(username, password, recaptchaSolver, false);
      }
    }
  }

  protected async parseLoginResult(page: Page): Promise<Page> {
    const accountPage = await this.http.followAllRedirect(page);
    if (accountPage.bodyDecoded.includes('Entrar no Sistema')) {
      if (accountPage.bodyDecoded.includes('Usuário e/ou senha inválidos')) {
        this.formPage = accountPage;
        throw new Error(this.errorInvalidCredentials);
      } else if (
        accountPage.bodyDecoded.includes(
          'Verificação recaptcha incorreta! Tente novamente.'
        )
      ) {
        throw new Error('SIGAA: Invalid captcha.');
      } else if (
        accountPage.bodyDecoded.includes('Comportamento suspeito detectado')
      ) {
        throw new Error('SIGAA: Suspicious behavior detected.');
      } else {
        // console.log(accountPage.bodyDecoded);
        throw new Error('SIGAA: Invalid response after login attempt.');
      }
    } else {
      this.session.loginStatus = LoginStatus.Authenticated;
      return accountPage;
    }
  }
}

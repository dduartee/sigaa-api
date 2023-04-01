import { Parser } from '@helpers/sigaa-parser';
import { HTTP } from '@session/sigaa-http';
import { Page } from '@session/sigaa-page';
import { URL } from 'url';
import {
  SubjectResult,
  SigaaSearchSubjectResult
} from './sigaa-search-subject-result';
import {
  Campus
} from '../sigaa-public-interfaces';

/**
 * @category Public
 */
export class SigaaSearchSubject {
  page: Page | null = null;

  constructor(private http: HTTP, private parser: Parser) {}

  async loadSearchPage(): Promise<void> {
    if (!this.page) {
      this.page = await this.http.get(
        '/sigaa/public/turmas/listar.jsf'
      );
    }
  }

  async getCampusList(): Promise<Campus[]> {
    await this.loadSearchPage();
    const page = this.page as Page;
    const campusOptionElements = page
      .$('select#formTurma\\:inputDepto > option')
      .toArray();
    const list = [];
    for (const campusOptionElement of campusOptionElements) {
      list.push({
        name: this.parser.removeTagsHtml(page.$(campusOptionElement).html()),
        value: this.parser.removeTagsHtml(page.$(campusOptionElement).val())
      });
    }
    return list;
  }

  async getSubjectList(campus?: Campus): Promise<SubjectResult[]> {
    await this.loadSearchPage();
    const page = this.page as Page;
    let campusValue;
    if (!campus) {
      campusValue = '0';
    } else {
      campusValue = campus.value;
    }
    const formElement = page.$('form[name="form"]');
    const action = formElement.attr('action');
    if (!action)
      throw new Error('SIGAA: Form with action at Subject search page.');

    const url = new URL(action, page.url);
    const postValues: Record<string, string> = {};
    const inputs = formElement
      .find("input[name]:not([type='submit'])")
      .toArray();
    for (const input of inputs) {
      const name = page.$(input).attr('name');
      if (name) postValues[name] = page.$(input).val();
    }
    postValues['form:departamento'] = campusValue;
    postValues['form:buscar'] = 'Buscar';
    return this.http
      .post(url.href, postValues)
      .then((page) => this.parseSearchResults(page));
  }

  private async parseSubjectSearchResults(page: Page, rowElement: cheerio.Element , results_var: any[]): Promise<void> {
    const name = this.parser.removeTagsHtml(
      page.$(rowElement).find('span.tituloDisciplina').html()
    );
    
    // In Progress

    results_var.push(
      new SigaaSearchSubjectResult(this.http, this.parser, {
        id,
        name,
        teams
      })
    );

  }

  private async parseTeamsSearchResults(page: Page, rowElement: cheerio.Element, results_var: any[], actualTeams_var: any[]): Promise<void> {
    const id = this.parser.removeTagsHtml(
      page.$(rowElement).find('span.turma').html()
    );
    
    // In Progress

    results_var.push(
      new SigaaSearchSubjectResult(this.http, this.parser, {
        id,
        teacher,
        schedule,
        location
      })
    );
  }

  private async parseSearchResults(page: Page): Promise<SigaaSearchSubjectResult[]> {
    const rowElements = page.$('table.listagem > tbody > tr[class]').toArray();
    const results:any = [];
    const actualTeams:any = [];
    for (const rowElement of rowElements) {
      if (page.$(rowElement).hasClass("agrupador")) {
        this.parseSubjectSearchResults(page, rowElement, results);
      }
      else if (page.$(rowElement).hasClass("linhaPar") || page.$(rowElement).hasClass("linhaImpar")){
        this.parseTeamsSearchResults(page, rowElement, results, actualTeams);
      }
      else {continue;}
    }
    return results;
  }
}

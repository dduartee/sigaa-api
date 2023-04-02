import { Parser } from '@helpers/sigaa-parser';
import { HTTP } from '@session/sigaa-http';
import { Page } from '@session/sigaa-page';
import { URL } from 'url';
import {
  SigaaSearchTeamsResult,
  SigaaSearchSubjectResult,
  SubjectResult,
  TeamsResult
} from './sigaa-search-subject-result';
import {
  Campus
} from '../sigaa-common-structures';

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
    const formElement = page.$('form[name="formTurma"]');
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
    postValues['formTurma:inputDepto'] = campusValue;
    postValues['formTurma:j_id_jsp_1370969402_11'] = 'Buscar';
    return this.http
      .post(url.href, postValues)
      .then((page) => this.parseSearchResults(page));
  }

  private async parseSubjectSearchResults(page: Page, rowElement: cheerio.Element): Promise<SubjectResult> {
    const id_name:string[] = this.parser.removeTagsHtml(
      page.$(rowElement).find('span.tituloDisciplina').html()
    ).split("-");
    const id = id_name[0];
    const name = id_name[1];
    const teams:TeamsResult[] = []
    return {
      id,
      name,
      teams
    };
  }

  private async parseTeamsSearchResults(page: Page, rowElement: cheerio.Element): Promise<TeamsResult> {
    const id: number = parseInt(this.parser.removeTagsHtml(
      page.$(rowElement).find('td.turma').html()
    ));

    const teacher: string = this.parser.removeTagsHtml(
      page.$(rowElement).find('td.nome').html()
    );
    const schedule: string = this.parser.removeTagsHtml(
      page.$(rowElement).find('td:nth-of-type(4)').html()
    );
    const location: string = this.parser.removeTagsHtml(
      page.$(rowElement).find('td:nth-of-type(8)').html()
    );

    return {
      id,
      teacher,
      schedule,
      location
    };

    
  }

  private async parseSearchResults(page: Page): Promise<SubjectResult[]> {
    const rowElements = page.$('table.listagem > tbody > tr[class]').toArray();
    const results:SubjectResult[] = [];
    let actualTeams:TeamsResult[] = [];
    for (const rowElement of rowElements) {
      if (page.$(rowElement).hasClass("agrupador")) {
        results.push(
          new SigaaSearchSubjectResult(this.http, this.parser, await this.parseSubjectSearchResults(page, rowElement))
        );
        actualTeams = [];
      }
      else if (page.$(rowElement).hasClass("linhaPar") || page.$(rowElement).hasClass("linhaImpar")){
        
        results[results.length - 1].teams.push(
          new SigaaSearchTeamsResult(this.http, this.parser, await this.parseTeamsSearchResults(page, rowElement))
        );
      }
      else {
        continue;
      }
    }
    return results;
  }
}

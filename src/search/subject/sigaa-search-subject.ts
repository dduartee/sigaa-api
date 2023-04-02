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

  async search(jsonsify?:boolean, campus?: Campus, year?:number, period?:number): Promise<SubjectResult[]> {
    await this.loadSearchPage();
    const page = this.page as Page;
    let campusValue, in_json: boolean;
    if (!campus) {
      campusValue = '0';
    } else {
      campusValue = campus.value;
    }
    if (!jsonsify) {
      in_json = false;
    } else {
      in_json = jsonsify;
    }
    if (!period) {
      period = 1;
    }
    else if (Number.isInteger(period) && 1 > period && period > 4) {
      throw new Error("SIGAA: Invalid period value.");
    }
    if (!year) {
      const now = new Date()
      year = now.getFullYear();
    }
    else if (Number.isInteger(year) && year < 1950 && year > 2100) {
      throw new Error("SIGAA: Invalid year value.");
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
    postValues['formTurma:inputNivel'] = "";
    postValues['formTurma:inputDepto'] = campusValue;
    postValues['formTurma:inputAno'] = year.toString();
    postValues['formTurma:inputPeriodo'] = period.toString();
    postValues['formTurma:j_id_jsp_1370969402_11'] = 'Buscar';
    return this.http
      .post(url.href, postValues)
      .then((page) => this.parseSearchResults(page, in_json));
  }

  private async parseSubjectSearchResults(page: Page, rowElement: cheerio.Element): Promise<SubjectResult> {
    const id_name:string[] = this.parser.removeTagsHtml(
      page.$(rowElement).find('span.tituloDisciplina').html()
    ).split("-");
    const id = id_name[0];
    const name = id_name[1];
    const teams:any[] = []
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
  private async jsonfySubjectResult(page: Page, rowElements: cheerio.Element[]): Promise<SubjectResult[]> {
    const results: SubjectResult[] = [];
    for (const rowElement of rowElements) {
      if (page.$(rowElement).hasClass("agrupador")) {
        results.push(await this.parseSubjectSearchResults(page, rowElement));
        
      }
      else if (page.$(rowElement).hasClass("linhaPar") || page.$(rowElement).hasClass("linhaImpar")){
        results[results.length - 1].teams.push(await this.parseTeamsSearchResults(page, rowElement));
      }
      else {
        continue;
      }
    }
    return results;
  }

  private async objectfySubjectResult(page: Page, rowElements: cheerio.Element[]): Promise<SubjectResult[]> {
    const results:SubjectResult[] = [];
    for (const rowElement of rowElements) {
      if (page.$(rowElement).hasClass("agrupador")) {
        results.push(
          new SigaaSearchSubjectResult(this.http, this.parser, await this.parseSubjectSearchResults(page, rowElement))
        );
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

  private async parseSearchResults(page: Page, in_json: boolean): Promise<SubjectResult[]> {
    const rowElements = page.$('table.listagem > tbody > tr[class]').toArray();
    if (in_json) {
      return this.jsonfySubjectResult(page, rowElements);
    } else {
      return this.objectfySubjectResult(page, rowElements);
    }
  }
}

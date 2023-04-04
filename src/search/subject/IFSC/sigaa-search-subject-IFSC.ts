import { Parser } from '@helpers/sigaa-parser';
import { HTTP } from '@session/sigaa-http';
import { Page } from '@session/sigaa-page';
import { URL } from 'url';
import { Campus } from '../../sigaa-common-structures';
import {
  SigaaSearchSubjectResultIFSC,
  SigaaSearchTeamsResultIFSC,
  SubjectResultIFSC,
  TeamsResultIFSC
} from './sigaa-search-subject-result-IFSC';

/**
 * @category Public
 */
export class SigaaSearchSubjectIFSC {
  page: Page | null = null;

  constructor(private http: HTTP, private parser: Parser) {}

  async loadSearchPage(): Promise<void> {
    if (!this.page) {
      this.page = await this.http.get('/sigaa/public/turmas/listar.jsf');
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

  async search(
    jsonsify?: boolean,
    campus?: Campus,
    year?: number,
    period?: number
  ): Promise<SubjectResultIFSC[]> {
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
    } else if (Number.isInteger(period) && 1 > period && period > 4) {
      throw new Error('SIGAA: Invalid period value.');
    }
    if (!year) {
      const now = new Date();
      year = now.getFullYear();
    } else if (Number.isInteger(year) && year < 1950 && year > 2100) {
      throw new Error('SIGAA: Invalid year value.');
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
    postValues['formTurma:inputNivel'] = '';
    postValues['formTurma:inputDepto'] = campusValue;
    postValues['formTurma:inputAno'] = year.toString();
    postValues['formTurma:inputPeriodo'] = period.toString();

    const searchButtonNameAttr = page.$('input[value="Buscar"]').attr('name');
    if (!searchButtonNameAttr)
      throw new Error('SIGAA: Search button not found.');

    postValues[searchButtonNameAttr] = 'Buscar';

    const pageResults = await this.http.post(url.href, postValues);
    return this.parseSearchResults(pageResults, in_json);
  }

  private async parseSearchResults(
    page: Page,
    in_json: boolean
  ): Promise<SubjectResultIFSC[]> {
    if (
      page.bodyDecoded.includes(
        'Não foram encontrados resultados para a busca com estes parâmetros.'
      )
    )
      return [];
    const rowHeaderElements = page
      .$('table.listagem > thead > tr > th')
      .toArray();
    const rowElements = page.$('table.listagem > tbody > tr[class]').toArray();

    if (in_json) {
      return this.jsonfySubjectResult(page, rowHeaderElements, rowElements);
    } else {
      return this.objectfySubjectResult(page, rowHeaderElements, rowElements);
    }
  }

  private jsonfySubjectResult(
    page: Page,
    rowHeaderElements: cheerio.Element[],
    rowElements: cheerio.Element[]
  ): SubjectResultIFSC[] {
    const results = [];
    for (const rowElement of rowElements) {
      if (page.$(rowElement).hasClass('agrupador')) {
        results.push(this.parseSubjectSearchResults(page, rowElement));
      } else if (
        page.$(rowElement).hasClass('linhaPar') ||
        page.$(rowElement).hasClass('linhaImpar')
      ) {
        results[results.length - 1].teams.push(
          this.parseTeamsSearchResults(page, rowHeaderElements, rowElement)
        );
      } else {
        continue;
      }
    }
    return results;
  }

  private async objectfySubjectResult(
    page: Page,
    rowHeaderElements: cheerio.Element[],
    rowElements: cheerio.Element[]
  ): Promise<SubjectResultIFSC[]> {
    const results: SubjectResultIFSC[] = [];
    for (const rowElement of rowElements) {
      if (page.$(rowElement).hasClass('agrupador')) {
        results.push(
          new SigaaSearchSubjectResultIFSC(
            this.http,
            this.parser,
            this.parseSubjectSearchResults(page, rowElement)
          )
        );
      } else if (
        page.$(rowElement).hasClass('linhaPar') ||
        page.$(rowElement).hasClass('linhaImpar')
      ) {
        results[results.length - 1].teams.push(
          new SigaaSearchTeamsResultIFSC(
            this.http,
            this.parser,
            this.parseTeamsSearchResults(page, rowHeaderElements, rowElement)
          )
        );
      } else {
        continue;
      }
    }
    return results;
  }
  private parseSubjectSearchResults(
    page: Page,
    rowElement: cheerio.Element
  ): SubjectResultIFSC {
    const id_name: string[] = this.parser
      .removeTagsHtml(page.$(rowElement).find('span.tituloDisciplina').html())
      .split(' - ');
    const id = id_name[0];
    const name = id_name[1];
    const teams: TeamsResultIFSC[] = [];
    return {
      id,
      name,
      teams
    };
  }

  private parseTeamsSearchResults(
    page: Page,
    rowHeaderElements: cheerio.Element[],
    rowElement: cheerio.Element
  ) {
    let id: number | undefined;
    let teacher: string | undefined;
    let location: string | undefined;
    for (let i = 0; i < rowHeaderElements.length; i++) {
      const columnHeader = page.$(rowHeaderElements[i]).text();
      const columnValue = page.$(rowElement).find('td').eq(i).text();
      switch (columnHeader) {
        case 'Código':
          id = Number.parseInt(columnValue);
          break;
        case 'Docente':
          teacher = columnValue;
          break;
        case 'Local':
          location = columnValue;
      }
    }
    if (id === undefined) throw new Error('SIGAA: Could not parse team id.');
    if (teacher === undefined)
      throw new Error('SIGAA: Could not parse teacher.');
    if (location === undefined)
      throw new Error('SIGAA: Could not parse location.');

    return {
      id,
      teacher,
      location
    };
  }
}

import { Parser } from '@helpers/sigaa-parser';
import { HTTP } from '@session/sigaa-http';
import { SigaaSearchTeacher } from './teacher/sigaa-search-teacher';
import { SigaaSearchSubject } from './subject/sigaa-search-subject';

/**
 * @category Public
 */
export class SigaaSearch {
  constructor(private http: HTTP, private parser: Parser) {}

  teacher(): SigaaSearchTeacher {
    return new SigaaSearchTeacher(this.http, this.parser);
  }
  subject(): SigaaSearchSubject {
    return new SigaaSearchSubject(this.http, this.parser);
  }
}

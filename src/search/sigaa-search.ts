import { Parser } from '@helpers/sigaa-parser';
import { HTTP } from '@session/sigaa-http';
import { SigaaSearchTeacher } from './teacher/sigaa-search-teacher';
import { Session } from '@session/sigaa-session';
import { SigaaSearchSubjectIFSC } from './subject/IFSC/sigaa-search-subject-IFSC';
import { SigaaSearchSubjectUNB } from './subject/UNB/sigaa-search-subject-UNB';
import { SigaaSearchSubjectUFFS } from './subject/UFFS/sigaa-search-subject-UFFS';

export type SigaaSearchSubject = SigaaSearchSubjectIFSC | SigaaSearchSubjectUNB | SigaaSearchSubjectUFFS;
export class SigaaSearch {
  constructor(
    private http: HTTP,
    private parser: Parser,
    private session: Session
  ) {}

  teacher(): SigaaSearchTeacher {
    return new SigaaSearchTeacher(this.http, this.parser);
  }
  subject(): SigaaSearchSubject {
    const institution = this.session.institution;
    const SigaaSearchSubject = {
      IFSC: SigaaSearchSubjectIFSC,
      UNB: SigaaSearchSubjectUNB,
      UFPB: SigaaSearchSubjectIFSC,
      UFFS: SigaaSearchSubjectUFFS
    };
    return new SigaaSearchSubject[institution](this.http, this.parser);
  }
}

import { ActivityFactory } from '@activity/sigaa-activity-factory';
import { CourseFactory } from '@courses/sigaa-course-student-factory';
import { Parser } from '@helpers/sigaa-parser';
import { HTTP } from '@session/sigaa-http';
import { HTTPFactory } from '@session/sigaa-http-factory';

import { SigaaStudentBondIFSC, StudentBond } from './student/sigaa-student-bond-ifsc';
import { SigaaTeacherBond, TeacherBond } from './sigaa-teacher-bond';
import { SigaaStudentBondUFFS } from './student/sigaa-student-bond-uffs';
import { Session } from '@session/sigaa-session';
import { InstitutionType } from '@session/sigaa-institution-controller';

/**
 * Union of all bonds (StudentBont and TeacherBond).
 * @category Internal
 */
export type BondType = StudentBond | TeacherBond;

/**
 * Abstraction to represent a class that creates bond instances.\
 * @category Internal
 */
export interface BondFactory {
  /**
   * Creates a student program instance.
   *
   * @param registration It is the student registration code, in IFSC it is called "matrícula".
   * @param program It's the name of the student program, in IFSC it is called "curso".
   * @param bondSwitchUrl If the user has more than one bond, the bond link will be used to change the bond
   */
  createStudentBond(
    institution: InstitutionType,
    registration: string,
    program: string,
    bondSwitchUrl: URL | null
  ): StudentBond;

  /**
   * Creates a teacher bond instance.
   */
  createTeacherBond(): TeacherBond;
}

/**
 * Class to implements BondFactory.
 *
 * Serves to create bond instances.
 * @category Internal
 */
export class SigaaBondFactory implements BondFactory {
  constructor(
    private httpFactory: HTTPFactory,
    private parser: Parser,
    private courseFactory: CourseFactory,
    private activityFactory: ActivityFactory
  ) {}

  /**
   * Creates a student program instance.
   *
   * @param registration It is the student registration code
   * @param program It's the name of the student program, in Portuguese it is called "curso".
   * @param bondSwitchUrl If the user has more than one bond, the bond link will be used to change the bond
   */
  createStudentBond(
    institution: InstitutionType,
    registration: string,
    program: string,
    bondSwitchUrl: URL | null
  ): StudentBond {
    let http: HTTP;
    if (bondSwitchUrl) {
      http = this.httpFactory.createHttpWithBond(bondSwitchUrl);
    } else {
      http = this.httpFactory.createHttp();
    }
    const SigaaStudentBond = {
      IFSC: SigaaStudentBondIFSC,
      UFPB: SigaaStudentBondIFSC,
      UNB: SigaaStudentBondIFSC,
      UFFS: SigaaStudentBondUFFS
    }
    return new SigaaStudentBond[institution](
      http,
      this.parser,
      this.courseFactory,
      this.activityFactory,
      program,
      registration,
      institution,
      bondSwitchUrl
    );
  }

  /**
   * Creates a teacher bond instance.
   */
  createTeacherBond(): TeacherBond {
    return new SigaaTeacherBond();
  }
}

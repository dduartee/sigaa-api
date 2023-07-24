import { Parser } from '@helpers/sigaa-parser';
import { HTTP } from '@session/sigaa-http';
import { sharedReturn } from '@helpers/sigaa-shared-return-decorator-factory';
import { CourseResourcesManagerFactory } from './sigaa-course-resources-manager-factory';
import { CourseStudent, SigaaCourseStudent } from './sigaa-course-student';
import type { CourseStudentData } from './sigaa-course-student';
import { LessonParserFactory } from './sigaa-lesson-parser-factory';
import type { InstitutionType } from '@session/sigaa-institution-controller';

/**
 * Abstraction to represent the class that instantiates the CourseStudent.
 * @category Internal
 */
export interface CourseFactory {
  createCourseStudent(courseData: CourseStudentData, institution: InstitutionType): CourseStudent;
}

/**
 * Default implementation of CourseFactory
 * @category Internal
 */
export class SigaaCourseFactory implements CourseFactory {
  constructor(
    private http: HTTP,
    private parser: Parser,
    private courseResourcesManagerFactory: CourseResourcesManagerFactory,
    private lessonParserFactory: LessonParserFactory
  ) {}

  @sharedReturn()
  createCourseStudent(courseData: CourseStudentData, institution: InstitutionType): SigaaCourseStudent {
    return new SigaaCourseStudent(
      courseData,
      institution,
      this.http,
      this.parser,
      this.courseResourcesManagerFactory,
      this.lessonParserFactory
    );
  }
}

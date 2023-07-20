import { StudentBond } from '@bonds/student/sigaa-student-bond-ifsc';
import { Exam } from '@courseResources/sigaa-exam-student';
import { CourseStudent } from '@courses/sigaa-course-student';

/**
 *
 * @category Internal
 */
export interface ActivityExamData {
  courseTitle: string;
  examDescription: string;
  date: Date;
  done: boolean;
}
/**
 *
 * @category Public
 */
export interface ActivityExam {
  readonly type: 'exam';

  /**
   * Return the activity course.
   */
  getCourse(): Promise<CourseStudent>;

  /**
   * Return the activity exam.
   */
  getExam(): Promise<Exam>;

  /* Exam description */
  examDescription: string;

  /* Exam course title */
  courseTitle: string;

  /*Activity date */
  readonly date: Date;

  /* If the exam deadline has expired or if it has already been sent */
  readonly done: boolean;
}

export class SigaaActivityExam implements ActivityExam {
  public readonly type = 'exam';

  constructor(
    private activityData: ActivityExamData,
    private studentBond: StudentBond
  ) {}

  /**
   * @inheritdoc
   */
  get examDescription(): string {
    return this.activityData.examDescription;
  }

  /**
   * @inheritdoc
   */
  get courseTitle(): string {
    return this.activityData.courseTitle;
  }

  /**
   * @inheritdoc
   */
  async getCourse(): Promise<CourseStudent> {
    const courses = await this.studentBond.getCourses();
    const validCourses = courses.filter(
      (course) => course.title === this.courseTitle
    );
    if (validCourses.length === 0)
      throw new Error(
        'SIGAA: No course with title specified in the found activity.'
      );
    if (validCourses.length > 1)
      throw new Error(
        'SIGAA: It was not possible to identify the course as there is more than one course with the same title specified in the activity.'
      );
    return validCourses[0];
  }

  /**
   * @inheritdoc
   */
  async getExam(): Promise<Exam> {
    const course = await this.getCourse();
    const exams = await course.getExamCalendar();
    const validExams = exams.filter(
      (exam) => exam.description === this.examDescription
    );
    if (validExams.length === 0)
      throw new Error(
        'SIGAA: Exam description specified in activity not found.'
      );
    if (validExams.length > 1)
      throw new Error(
        'SIGAA: The exam description specified in the activity corresponds to more than one exam.'
      );
    return validExams[0];
  }

  /**
   * @inheritdoc
   */
  get date(): Date {
    return this.activityData.date;
  }

  /**
   * @inheritdoc
   */
  get done(): boolean {
    return this.activityData.done;
  }
}

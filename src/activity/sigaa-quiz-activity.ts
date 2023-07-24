import { Quiz } from '@attachments/sigaa-quiz-student';
import { StudentBond } from '@bonds/student/sigaa-student-bond-ifsc';
import { CourseStudent } from '@courses/sigaa-course-student';
import { SigaaForm } from '@session/sigaa-page';

/**
 *
 * @category Internal
 */
export interface ActivityQuizData {
  courseTitle: string;
  quizTitle: string;
  id: string;
  form: SigaaForm;
  date: Date;
  done: boolean;
}
/**
 *
 * @category Public
 */
export interface ActivityQuiz {
  readonly type: 'quiz';

  /**
   * Return the activity course.
   */
  getCourse(): Promise<CourseStudent>;
  getQuiz(): Promise<Quiz>;

  /* Quiz id */
  quizId: string;
  /* Quiz title*/
  quizTitle: string;

  /* Quiz course ID */
  courseId: string;
  /* Quiz course title */
  courseTitle: string;

  /* Activity date */
  readonly date: Date;

  /* If the quiz deadline has expired has expired or if it has already been sent */
  readonly done: boolean;
}

export class SigaaActivityQuiz implements ActivityQuiz {
  public readonly type = 'quiz';

  constructor(
    private activityData: ActivityQuizData,
    private studentBond: StudentBond
  ) {}

  /**
   * @inheritdoc
   */
  get quizId(): string {
    if (!this.activityData.form.postValues)
      throw new Error('SIGAA: Activity Quiz form without id.');
    return this.activityData.form.postValues['id'];
  }

  /**
   * @inheritdoc
   */
  get quizTitle(): string {
    return this.activityData.quizTitle;
  }

  /**
   * @inheritdoc
   */
  get courseId(): string {
    if (!this.activityData.form.postValues['idTurma'])
      throw new Error('SIGAA: Activity Quiz form without idTurma.');
    return this.activityData.form.postValues['idTurma'];
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
    const course = courses.find((course) => course.id === this.courseId);
    if (!course)
      throw new Error(
        'SIGAA: Cannot find the course referenced by the activity.'
      );
    return course;
  }

  /**
   * @inheritdoc
   */
  async getQuiz(): Promise<Quiz> {
    const course = await this.getCourse();
    const quizzes = await course.getQuizzes();
    const quiz = quizzes.find((quiz) => quiz.id === this.quizId);
    if (!quiz)
      throw new Error(
        'SIGAA: Cannot find the quiz referenced by the activity.'
      );
    return quiz;
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

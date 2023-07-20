import { Homework } from '@attachments/sigaa-homework-student';
import { StudentBond } from '@bonds/student/sigaa-student-bond-ifsc';
import { CourseStudent } from '@courses/sigaa-course-student';
import { SigaaForm } from '@session/sigaa-page';

/**
 *
 * @category Internal
 */
export interface ActivityHomeworkData {
  courseTitle: string;
  homeworkTitle: string;
  form: SigaaForm;
  date: Date;
  done: boolean;
}
/**
 * Interface describing homework activity
 * @category Public
 */
export interface ActivityHomework {
  readonly type: 'homework';

  /**
   * Return the activity course.
   */
  getCourse(): Promise<CourseStudent>;

  /**
   * Return the activity homework.
   */
  getHomework(): Promise<Homework>;

  /* Homework id */
  homeworkId: string;

  /* Homework title */
  homeworkTitle: string;

  /* Homework course ID */
  courseId: string;

  /* Homework course title */
  courseTitle: string;

  /* Activity date */
  readonly date: Date;

  /* If the homework deadline has expired or if it has already been sent */
  readonly done: boolean;
}
/**
 * Implements ActivityHomework
 * @category Public
 */
export class SigaaActivityHomework implements ActivityHomework {
  public readonly type = 'homework';

  constructor(
    private activityData: ActivityHomeworkData,
    private studentBond: StudentBond
  ) {}

  /**
   * @inheritdoc
   */
  get homeworkId(): string {
    return this.activityData.form.postValues['id'];
  }

  /**
   * @inheritdoc
   */
  get homeworkTitle(): string {
    return this.activityData.homeworkTitle;
  }

  /**
   * @inheritdoc
   */
  get courseId(): string {
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
  async getHomework(): Promise<Homework> {
    const course = await this.getCourse();
    const homeworkList = await course.getHomeworks();
    const homework = homeworkList.find(
      (homework) => homework.id === this.homeworkId
    );
    if (!homework)
      throw new Error(
        'SIGAA: Cannot find the homework referenced by the activity.'
      );
    return homework;
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

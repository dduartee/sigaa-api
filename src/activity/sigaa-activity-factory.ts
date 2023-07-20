import {
  ActivityExam,
  ActivityExamData,
  SigaaActivityExam
} from './sigaa-exam-activity';
import {
  ActivityQuiz,
  ActivityQuizData,
  SigaaActivityQuiz
} from './sigaa-quiz-activity';
import {
  ActivityHomework,
  ActivityHomeworkData,
  SigaaActivityHomework
} from './sigaa-homework-activity';
import { StudentBond } from '@bonds/student/sigaa-student-bond-ifsc';

/**
 * @category Internal
 */
export interface ActivityFactory {
  createActivityQuiz(
    activityData: ActivityQuizData,
    studentBond: StudentBond
  ): ActivityQuiz;
  createActivityExam(
    activityData: ActivityExamData,
    studentBond: StudentBond
  ): ActivityExam;
  createActivityHomework(
    activityData: ActivityHomeworkData,
    studentBond: StudentBond
  ): ActivityHomework;
}

/**
 * @category Public
 */
export type Activity = ActivityHomework | ActivityExam | ActivityQuiz;

/**
 * @category Internal
 */
export class SigaaActivityFactory implements ActivityFactory {
  createActivityQuiz(
    activityData: ActivityQuizData,
    studentBond: StudentBond
  ): SigaaActivityQuiz {
    return new SigaaActivityQuiz(activityData, studentBond);
  }

  createActivityExam(
    activityData: ActivityExamData,
    studentBond: StudentBond
  ): ActivityExam {
    return new SigaaActivityExam(activityData, studentBond);
  }

  createActivityHomework(
    activityData: ActivityHomeworkData,
    studentBond: StudentBond
  ): ActivityHomework {
    return new SigaaActivityHomework(activityData, studentBond);
  }
}

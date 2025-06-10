import { HttpException, Injectable } from '@nestjs/common';
import HttpStatusCode from 'src/utils/HttpStatusCode';
import { StudentAnswer } from './entities/student-answer.entity';
import { DataSource } from 'typeorm';
import { Student } from '../user/entities/student.entity';
import { Question } from '../question/entities/question.entity';
import { QUESTION_TYPE } from 'src/utils/constants';
import { SectionProgress } from '../course-owning/entities/section-progress.entity';
import { CourseOwning } from '../course-owning/entities/course-owning.entity';
import { LessonProgress } from '../course-owning/entities/lesson-progress.entity';
import { GradeManualAnswerDto } from './dto/grade-manual-answer.dto';

@Injectable()
export class StudentAnswerService {
  constructor(private readonly dataSource: DataSource) {}

  async submit(studentAnswers: StudentAnswer[], userAwsId: string) {
    try {
      const student = await this.findStudentByCognito(userAwsId);

      const submittedAnswers = await this.dataSource.getRepository(StudentAnswer).find({
        where: {
          student: { id: student.id },
        },
      });

      const submittedQuestionIds = submittedAnswers.map((a) => a.question.id);
      const newAnswers = studentAnswers.filter(
        (a) => !submittedQuestionIds.includes(a.question.id)
      );

      await Promise.all(
        newAnswers.map(async (sa) => {
          sa.student = student;
          sa.question = await this.dataSource.getRepository(Question).findOne({
            where: { id: sa.question.id },
            relations: ['answers'],
          });
        })
      );

      const autoGraded = newAnswers.filter((sa) =>
        [QUESTION_TYPE.COMBO_BOX, QUESTION_TYPE.BLANK, QUESTION_TYPE.MULTIPLE_CHOICE].includes(sa.question.type)
      );

      const manualGraded = newAnswers.filter((sa) =>
        [QUESTION_TYPE.WRITING_QUESTION, QUESTION_TYPE.SPEAKING_QUESTION].includes(sa.question.type)
      );

      await this.submitAutoGraded(autoGraded);
      await this.submitManualGraded(manualGraded);

      await this.dataSource.getRepository(StudentAnswer).save(newAnswers);
      await this.updateProgress(student);

      return newAnswers;
    } catch (error) {
      console.log(error);
      throw new HttpException('Internal Server Error', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async gradeManualAnswer(answerId: string, dto: GradeManualAnswerDto) {
    const answerRepo = this.dataSource.getRepository(StudentAnswer);
    const answer = await answerRepo.findOne({ where: { id: answerId }, relations: ['question'] });

    if (!answer) {
      throw new HttpException('Answer not found', HttpStatusCode.NOT_FOUND);
    }

    if (![QUESTION_TYPE.SPEAKING_QUESTION, QUESTION_TYPE.WRITING_QUESTION].includes(answer.question.type)) {
      throw new HttpException('Only manual questions can be graded manually', HttpStatusCode.BAD_REQUEST);
    }

    answer.score = dto.score;
    answer.feedback = dto.feedback;
    answer.isCorrect = null;

    await answerRepo.save(answer);
    return answer;
  }

  async checkSubmission(studentAwsId: string, sectionId: string) {
    const student = await this.findStudentByCognito(studentAwsId);
    const answers = await this.dataSource.getRepository(StudentAnswer)
      .createQueryBuilder('answer')
      .leftJoin('answer.student', 'student')
      .leftJoin('answer.question', 'question')
      .leftJoin('question.section', 'section')
      .where('student.id = :studentId', { studentId: student.id })
      .andWhere('section.id = :sectionId', { sectionId })
      .getMany();

    const isSubmitted = answers.length > 0;
    const totalScore = answers.reduce((sum, a) => sum + (a.score || 0), 0);

    return { isSubmitted, score: isSubmitted ? totalScore : null };
  }

  private async submitAutoGraded(answers: StudentAnswer[]) {
    for (const studentAnswer of answers) {
      const correctAnswers = studentAnswer.question.answers.filter((a) => a.isCorrect);

      switch (studentAnswer.question.type) {
        case QUESTION_TYPE.COMBO_BOX:
        case QUESTION_TYPE.BLANK:
          studentAnswer.isCorrect = correctAnswers[0]?.text === studentAnswer.answer;
          studentAnswer.score = studentAnswer.isCorrect ? 1 : 0;
          break;

        case QUESTION_TYPE.MULTIPLE_CHOICE:
          const isCorrect = correctAnswers.every((ca) =>
            studentAnswer.answer.includes(ca.text)
          ) && studentAnswer.answer.length === correctAnswers.length;
          studentAnswer.isCorrect = isCorrect;
          studentAnswer.score = isCorrect ? 1 : 0;
          break;
      }
    }
  }

  private async submitManualGraded(answers: StudentAnswer[]) {
    for (const sa of answers) {
      sa.isCorrect = null;
      sa.score = null;
      sa.feedback = null;
    }
  }

  private async findStudentByCognito(userAwsId: string): Promise<Student> {
    const student = await this.dataSource.getRepository(Student)
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.userInfo', 'userInfo')
      .where('userInfo.awsCognitoId = :awsId', { awsId: userAwsId })
      .getOne();

    if (!student) {
      throw new HttpException('Student not found', HttpStatusCode.NOT_FOUND);
    }
    return student;
  }

  private async updateProgress(student: Student) {
    const courseOwning = await this.dataSource
      .getRepository(CourseOwning)
      .createQueryBuilder('courseOwning')
      .leftJoin('courseOwning.student', 'student')
      .leftJoin('courseOwning.lessonProgresses', 'lessonProgresses')
      .select(['courseOwning', 'student', 'lessonProgresses'])
      .where('student.id = :studentId', { studentId: student.id })
      .andWhere('courseOwning.expiredDate > :currDate', {
        currDate: new Date(),
      })
      .getOneOrFail();

    const sectionProgress = await this.dataSource
      .getRepository(SectionProgress)
      .createQueryBuilder('sectionProgress')
      .leftJoinAndSelect('sectionProgress.courseOwning', 'courseOwning')
      .where('courseOwning.id = :courseOwningId', {
        courseOwningId: courseOwning.id,
      })
      .getOneOrFail();

    sectionProgress.isCompleted = true;

    const lessonProgress = await this.dataSource
      .getRepository(LessonProgress)
      .createQueryBuilder('lessonProgress')
      .leftJoinAndSelect('lessonProgress.sectionProgresses', 'sectionProgresses')
      .leftJoinAndSelect('lessonProgress.courseOwning', 'courseOwning')
      .where('courseOwning.id = :courseOwningId', {
        courseOwningId: courseOwning.id,
      })
      .getOneOrFail();

    const isLessonCompleted = lessonProgress.sectionProgresses.every(
      (section) => section.isCompleted,
    );

    lessonProgress.isCompleted = isLessonCompleted;

    const numberOfLesson = courseOwning.lessonProgresses.length;
    const numberOfCompletedLesson = courseOwning.lessonProgresses.filter(
      (lesson) => lesson.isCompleted,
    ).length;

    courseOwning.progress = (numberOfCompletedLesson / numberOfLesson) * 100;
  }

  findAll() {
    return `This action returns all studentAnswer`;
  }

  findOne(id: number) {
    return `This action returns a #${id} studentAnswer`;
  }

  remove(id: number) {
    return `This action removes a #${id} studentAnswer`;
  }
}

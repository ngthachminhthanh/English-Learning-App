import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CourseOwning } from './entities/course-owning.entity';
import { Student } from '../user/entities/student.entity';
import { Course } from '../course/entities/course.entity';
import { User } from '../user/entities/user.entity';
import { LessonProgress } from './entities/lesson-progress.entity';
import { SectionProgress } from './entities/section-progress.entity';
import { log } from 'console';

@Injectable()
export class CourseOwningService {
  constructor(private readonly dataSource: DataSource) { }
  async active(courseId: string, courseOwning: CourseOwning, userAwsId: string) {
    try {
      console.log("courseId", courseId)
      console.log("courseOwning", courseOwning)
      console.log("userAwsId", userAwsId)
      const student = await this.dataSource.getRepository(Student).findOne({
        where: { userInfo: { awsCognitoId: userAwsId } },
        relations: ['userInfo'],
      });

      console.log("student", student)
      const course = await this.dataSource.getRepository(Course).findOne({
        where: { id: courseId },
      });
      courseOwning.course = course;
      courseOwning.student = student;
      courseOwning.active = true
      return await this.dataSource.transaction(async (manager) => {
        const existingCourseOwning = await manager
          .getRepository(CourseOwning)
          .createQueryBuilder('courseOwning')
          .leftJoinAndSelect('courseOwning.student', 'student')
          .leftJoinAndSelect('courseOwning.course', 'course')
          .where('student.id = :studentId', { studentId: student.id })
          .andWhere('course.id = :courseId', { courseId: courseId })
          .getOne();
        if (existingCourseOwning) {
          await manager
            .getRepository(CourseOwning)
            .remove(existingCourseOwning);
        }
        const newCourseOwning = await manager
          .getRepository(CourseOwning)
          .save(courseOwning);
        // await Promise.all(
        //   courseOwning.course.lessons.map(async (lesson) => {
        //     const newLessonProgress = await manager
        //       .getRepository(LessonProgress)
        //       .save({
        //         courseOwning: newCourseOwning,
        //         lesson: lesson,
        //       });
        //     await Promise.all(
        //       lesson.sections.map(async (section) => {
        //         await manager.getRepository(SectionProgress).save({
        //           lessonProgress: newLessonProgress,
        //           courseOwning: newCourseOwning,
        //           section: section,
        //         });
        //       }),
        //     );
        //   }),
        // );
        return newCourseOwning;
      });
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
  findAll() {
    return `This action returns all courseOwning`;
  }

  findOne(id: number) {
    return `This action returns a #${id} courseOwning`;
  }

  remove(id: number) {
    return `This action removes a #${id} courseOwning`;
  }
}

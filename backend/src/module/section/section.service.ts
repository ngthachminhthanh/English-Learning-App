import { HttpException, Injectable } from '@nestjs/common';
import { Section } from './entities/section.entity';
import { DataSource } from 'typeorm';
import HttpStatusCode from 'src/utils/HttpStatusCode';
import { Lesson } from '../lesson/entities/lesson.entity';

@Injectable()
export class SectionService {
  constructor(private readonly dataSource: DataSource) { }
  private transformSection(section: Section) {
    return {
      id: section.id,
      title: section.title,
      type: section.type,
      lessonId: section.lesson ? section.lesson.id : null, // safely include lessonId

      // Add other fields if needed
    };
  }

  async createSectionFromMock(mockData: any) {
    try {
      const lesson = await this.dataSource
        .getRepository(Lesson)
        .findOne({ where: { id: mockData.lessonId } });
      if (!lesson) {
        throw new HttpException('Lesson not found', HttpStatusCode.NOT_FOUND);
      }

      // Create Section entity
      const section = this.dataSource.getRepository(Section).create({
        title: mockData.title,
        content: mockData.content,
        type: mockData.type,
        sectionMedia: mockData.sectionMedia,
        lesson: lesson,
        // You may need to handle questionGroups and questions here if you want to persist them
      });

      // Save section
      const savedSection = await this.dataSource.getRepository(Section).save(section);

      // Return in mock format
      return {
        id: savedSection.id,
        title: savedSection.title,
        type: savedSection.type,
        content: savedSection.content,
        sectionMedia: savedSection.sectionMedia,
        sectionQuestionGroups: mockData.sectionQuestionGroups || [],
        sectionQuestions: mockData.sectionQuestions || [],
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }
  // async create(lessonId: string, section: Section) {
  //   try {
  //     const lesson = await this.dataSource
  //       .getRepository(Lesson)
  //       .findOne({ where: { id: lessonId } });
  //     if (!lesson) {
  //       throw new HttpException('Lesson not found', HttpStatusCode.NOT_FOUND);
  //     }
  //     section.lesson = lesson;
  //     const savedSection = await this.dataSource.getRepository(Section).save(section);
  //     return this.transformSection(savedSection);
  //   } catch (error) {
  //     console.log(error);
  //     throw new HttpException(
  //       'Internal Server Error',
  //       HttpStatusCode.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  async findAllByLesson(lessonId: string) {
    try {
      const sections = await this.dataSource
        .getRepository(Section)
        .createQueryBuilder('section')
        .leftJoinAndSelect('section.lesson', 'lesson')
        .where('lesson.id = :id', { id: lessonId })
        .getMany();
      // Transform each section to mock format
      return sections.map(this.transformSection);
    } catch (error) {
      throw new HttpException(
        'Internal Server Error',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      const section = await this.dataSource
        .getRepository(Section)
        .createQueryBuilder('section')
        .leftJoin('section.questionGroups', 'questionGroups')
        .leftJoin('section.questions', 'sectionQuestions')
        .leftJoin('questionGroups.questions', 'questions')
        .select(['section', 'questionGroups', 'questions', 'sectionQuestions'])
        .where('section.id = :id', { id })
        .getOne();
      if (!section) return null;
      return this.transformSection(section);
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(section: Section, lessionId?: string) {
    try {
      if (lessionId) {
        const lesson = await this.dataSource
          .getRepository(Lesson)
          .findOne({ where: { id: lessionId } });
        if (!lesson) {
          throw new HttpException('Lesson not found', HttpStatusCode.NOT_FOUND);
        }
        section.lesson = lesson;
      }
      const updatedSection = await this.dataSource
        .getRepository(Section)
        .save(section);
      return updatedSection;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }
  remove(id: number) {
    return `This action removes a #${id} section`;
  }
}

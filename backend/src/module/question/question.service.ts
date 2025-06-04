import { HttpException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Question } from './entities/question.entity';
import { Section } from '../section/entities/section.entity';
import { QuestionGroup } from '../question-group/entities/question-group.entity';
import { QUESTION_TYPE } from 'src/utils/constants';

@Injectable()
export class QuestionService {
  constructor(private readonly dataSource: DataSource) {}
  async create(question: Question) {
    try {
      const questionGroupId = question.questionGroup.id ?? null;
      const sectionId = question.section.id ?? null;
      if (!questionGroupId && !sectionId) {
        throw new HttpException('Question group or section not found', 404);
      }
      const questionGroup = await this.dataSource
        .getRepository(QuestionGroup)
        .findOne({ where: { id: questionGroupId } });
      const section = await this.dataSource.getRepository(Section).findOne({
        where: { id: sectionId },
      });
      question.questionGroup = questionGroup;
      question.section = section;
      const newQuestion = await this.dataSource
        .getRepository(Question)
        .save(question);

      return newQuestion;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async createByType(body: {
  type: QUESTION_TYPE,
  sectionId: string,
  word?: string,
  wordType?: string,
  meaning?: string,
  paragraph?: string,
  mp4Url?: string,
  speakingPrompt?: string,
  writingPrompt?: string
}) {
  try {
    const section = await this.dataSource.getRepository(Section).findOne({
      where: { id: body.sectionId },
    });
    if (!section) throw new HttpException('Section not found', 404);

    let question = new Question();
    question.section = section;
    question.type = body.type;

    // Set fields based on type
    if (body.type === 'VOCAB') {
      question.word = body.word;
      question.wordType = body.wordType;
      question.meaning = body.meaning;
    } else if (body.type === 'READING') {
      question.paragraph = body.paragraph;
    } else if (body.type === 'LISTENING') {
      question.mp4Url = body.mp4Url;
    } else if (body.type === 'SPEAKING_QUESTION') {
      question.speakingPrompt = body.speakingPrompt;
    } else if (body.type === 'WRITING_QUESTION') {
      question.writtingPrompt = body.writingPrompt;
    }

    const saved = await this.dataSource.getRepository(Question).save(question);
    return saved;
  } catch (error) {
    throw new HttpException(error.message, 500);
  }
}

async getByType(sectionId: string, type: QUESTION_TYPE) {
  try {
    const questions = await this.dataSource.getRepository(Question).find({
      where: {
        section: { id: sectionId },
        type: type,
      },
    });
    return questions;
  } catch (error) {
    throw new HttpException(error.message, 500);
  }
}

  async findBySection(sectionId: string) {
    try {
      // find all questions by sectionId
      const questions = await this.dataSource
        .getRepository(Question)
        .find({ where: { section: { id: sectionId } } });

      return questions;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} question`;
  }

  update(question: Question) {
    try {
      // update a question
      const updatedQuestion = this.dataSource
        .getRepository(Question)
        .save(question);

      return updatedQuestion;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async remove(id: string) {
    try {
      // delete a question
      const deletedQuestion = await this.dataSource
        .getRepository(Question)
        .delete(id);

      return deletedQuestion;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }
}

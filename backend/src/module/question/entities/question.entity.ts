import { AutoMap } from '@automapper/classes';
import { Answer } from 'src/module/answer/entities/answer.entity';
import { Base } from 'src/module/base/base.entity';
import { QuestionGroup } from 'src/module/question-group/entities/question-group.entity';
import { Section } from 'src/module/section/entities/section.entity';
import { StudentAnswer } from 'src/module/student-answer/entities/student-answer.entity';
import { QUESTION_TYPE } from 'src/utils/constants';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

@Entity()
export class Question extends Base {
  @AutoMap()
  @ManyToOne(() => QuestionGroup, (questionGroup) => questionGroup.questions, {
    eager: true,
  })
  questionGroup?: QuestionGroup;
  @AutoMap()
  @ManyToOne(() => Section, (section) => section.questions)
  section: Section;
  @AutoMap()
  @Column({ nullable: true })
  text: string;
  @AutoMap()
  @Column({
    type: 'enum',
    enum: QUESTION_TYPE,
    default: QUESTION_TYPE.COMBO_BOX,
  })
  type: QUESTION_TYPE;
  @AutoMap()
  @OneToMany(() => StudentAnswer, (studentAnswer) => studentAnswer.question)
  studentAnswers: StudentAnswer;
  @AutoMap()
  @OneToMany(() => Answer, (answer) => answer.question, {
    eager: true,
    cascade: true,
  })
  answers: Answer[];
  @AutoMap()
  @Column({ nullable: true })
  order: number;

  @AutoMap()
  @Column({ nullable: true })
  word?: string;         // For VOCAB

  @AutoMap()
  @Column({ nullable: true })
  wordType?: string;     // For VOCAB

  @AutoMap()
  @Column({ nullable: true })
  meaning?: string;      // For VOCAB

  @AutoMap()
  @Column({ nullable: true, type: 'text' })
  paragraph?: string;    // For READING

  @AutoMap()
  @Column({ nullable: true })
  mp4Url?: string;       // For LISTENING

  @AutoMap()
  @Column({ nullable: true, type: 'text' })
  speakingPrompt?: string; // For SPEAKING

  @AutoMap()
  @Column({ nullable: true, type: 'text' })
  writtingPrompt?: string; // For WRITTING

  @AutoMap()
  @Column({ nullable: true, type: 'text' })
  answer?: string; // For WRITTING

  @AutoMap()
  @Column({ type: 'text', array: true, nullable: true })
  choices?: string[];
}

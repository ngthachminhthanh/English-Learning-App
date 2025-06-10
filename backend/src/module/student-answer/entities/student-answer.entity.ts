import { AutoMap } from '@automapper/classes';
import { Base } from 'src/module/base/base.entity';
import { Question } from 'src/module/question/entities/question.entity';
import { Student } from 'src/module/user/entities/student.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class StudentAnswer extends Base {
  @ManyToOne(() => Question, (question) => question.studentAnswers)
  question: Question;

  @ManyToOne(() => Student, (student) => student.studentAnswers)
  student: Student;

  @AutoMap()
  @Column()
  type: 'MULTIPLE_CHOICE' | 'WRITING' | 'SPEAKING';

  @AutoMap()
  @Column({ nullable: true })
  answer: string;

  @AutoMap()
  @Column({ nullable: true })
  isCorrect: boolean;

  @AutoMap()
  @Column({ nullable: true })
  score: number;

  @AutoMap()
  @Column({ nullable: true })
  feedback: string;

  @AutoMap()
  @Column({ nullable: true })
  fileUrl: string;
}

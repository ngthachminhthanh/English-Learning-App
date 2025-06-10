import { createMap, forMember, mapFrom, Mapper } from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { CreateStudentAnswerDto } from 'src/module/student-answer/dto/create-student-answer.dto';
import { StudentAnswer } from 'src/module/student-answer/entities/student-answer.entity';

@Injectable()
export class StudentAnswerProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        CreateStudentAnswerDto,
        StudentAnswer,
        forMember(
          (dest) => dest.question,
          mapFrom((src) => ({ id: src.questionId })),
        ),
        forMember(
          (dest) => dest.type,
          mapFrom((src) => src.type),
        ),
        forMember(
          (dest) => dest.answer,
          mapFrom((src) => src.answer),
        ),
        forMember(
          (dest) => dest.fileUrl,
          mapFrom((src) => src.fileUrl),
        )
      );
    };
  }
}

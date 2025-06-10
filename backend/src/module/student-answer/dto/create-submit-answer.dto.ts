// src/module/student-answer/dto/create-submit-answer.dto.ts

import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CreateStudentAnswerDto } from './create-student-answer.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubmitAnswerDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStudentAnswerDto)
  @ApiProperty({
    description: 'List of answers submitted by student',
    type: [CreateStudentAnswerDto],
  })
  answers: CreateStudentAnswerDto[];
}

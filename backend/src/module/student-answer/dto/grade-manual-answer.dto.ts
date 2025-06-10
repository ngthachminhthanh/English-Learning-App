import { IsNumber, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GradeManualAnswerDto {
  @ApiProperty({
    example: 8.5,
    description: 'Score from teacher (range: 0 to 10)',
    minimum: 0,
    maximum: 10,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  @Max(10)
  score: number;

  @ApiProperty({
    example: 'Good grammar but needs more structure.',
    description: 'Detailed feedback from the teacher to help student improve.',
    type: String,
  })
  @IsString()
  feedback: string;
}

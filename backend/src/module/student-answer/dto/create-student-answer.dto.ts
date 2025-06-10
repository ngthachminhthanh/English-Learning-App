import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { AutoMap } from '@automapper/classes';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudentAnswerDto {
  @ApiProperty({ description: 'Question ID' })
  @IsString()
  @IsNotEmpty()
  @AutoMap()
  questionId: string;

  @ApiProperty({
    description: 'Type of question',
    enum: ['MULTIPLE_CHOICE', 'WRITING', 'SPEAKING'],
    example: 'WRITING',
  })
  @IsString()
  @IsNotEmpty()
  @AutoMap()
  type: 'MULTIPLE_CHOICE' | 'WRITING' | 'SPEAKING';

  @ApiPropertyOptional({ description: 'Text answer (if applicable)' })
  @IsOptional()
  @IsString()
  @AutoMap()
  answer?: string;

  @ApiPropertyOptional({ description: 'File URL (for speaking/writing if needed)' })
  @IsOptional()
  @IsString()
  @AutoMap()
  fileUrl?: string;
}

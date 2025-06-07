import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { PAYMENT_METHOD } from 'src/utils/constants';

export class CreateCourseBuyingDto {
  @IsString()
  @AutoMap()
  @ApiProperty({
    description: 'Course id',
    type: String,
    example: '4922bbb6-5c5f-4a3b-ba22-a52d75f14de3',
  })
  courseId: string;
  @IsEnum(PAYMENT_METHOD)
  @AutoMap()
  @ApiProperty({
    description: 'Payment method',
    enum: PAYMENT_METHOD,
    example: PAYMENT_METHOD.QR_CODE,
  })
  paymentMethod: PAYMENT_METHOD;
}
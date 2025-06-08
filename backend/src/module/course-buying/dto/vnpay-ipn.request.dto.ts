import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsAlphanumeric,
  Length,
} from 'class-validator';

export class VnpayIPNRequest {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    type: Number,
    description: 'vnp_Amount',
    example: 1000000,
  })
  vnpAmount: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'vnp_BankCode',
    example: 'NCB',
  })
  vnpBankCode: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    type: String,
    description: 'vnp_BankTranNo',
    example: '123456',
  })
  vnpBankTranNo: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'vnp_CardType',
    example: 'VISA',
  })
  vnpCardType: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'vnp_OrderInfo',
    example: 'Thanh toan hoc phi',
  })
  vnpOrderInfo: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'vnp_PayDate',
    example: '20211019123456',
  })
  vnpPayDate: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'vnp_ResponseCode',
    example: '00',
  })
  vnpResponseCode: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'vnp_TmnCode',
    example: '123456',
  })
  vnpTmnCode: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    type: Number,
    description: 'vnp_TransactionNo',
    example: 123456,
  })
  vnpTransactionNo: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'vnp_TransactionStatus',
    example: '00',
  })
  vnpTransactionStatus: string;

  @IsString()
  @IsAlphanumeric()
  @Length(1, 100)
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'Mã tham chiếu giao dịch (chữ + số)',
    example: 'COURSE4922bbb65c5f4a3b1733652930',
  })
  vnp_TxnRef: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'vnp_SecureHash',
    example: 'test',
  })
  vnpSecureHash: string;
}
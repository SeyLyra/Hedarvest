import { IsNumber, IsNotEmpty, IsString } from 'class-validator';

export class BorrowFundsDto {
  @IsNumber()
  @IsNotEmpty()
  farmerId: number;

  @IsString()
  @IsNotEmpty()
  cropType: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number; // Amount in USDC (will be converted to smallest units)
}


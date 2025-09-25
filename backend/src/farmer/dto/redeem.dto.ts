import { IsInt, IsNumber, IsString, Min } from 'class-validator';

export class RedeemDto {
  @IsInt()
  farmerId: number;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  pin: string;
}



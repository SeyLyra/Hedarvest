import { IsInt, IsNumber, IsString, Min } from 'class-validator';

export class DepositPoolDto {
  @IsInt()
  poolId: number;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  depositorAddress: string;
}


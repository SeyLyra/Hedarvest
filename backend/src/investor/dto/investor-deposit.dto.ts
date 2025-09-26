import { IsString, IsNumber, Min } from 'class-validator';

export class InvestorDepositDto {
  @IsString()
  grainType: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  depositorAddress: string;
}

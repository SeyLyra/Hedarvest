import { IsString, IsNumber, Min } from 'class-validator';

export class InvestorWithdrawDto {
  @IsString()
  grainType: string;

  @IsNumber()
  @Min(0.01)
  shares: number;

  @IsString()
  depositorAddress: string;
}

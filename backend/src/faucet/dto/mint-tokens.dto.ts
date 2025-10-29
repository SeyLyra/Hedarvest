import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class MintTokensDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsNumber()
  @Min(0.01)
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @IsOptional()
  @IsString()
  @IsIn(['usdc', 'wheat', 'rice', 'corn'])
  tokenType?: string = 'usdc';
}

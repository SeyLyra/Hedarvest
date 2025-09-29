import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePoolDto {
  @IsString()
  grainType: string;

  @IsString()
  poolAddress: string;

  @IsString()
  oracleAddress: string;

  @IsString()
  lendingTokenAddress: string;

  @IsNumber()
  @Min(0)
  baseLtv: number;


  @IsNumber()
  @Min(0)
  protocolFee: number;
}

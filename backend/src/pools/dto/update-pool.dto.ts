import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class UpdatePoolDto {
  @IsOptional()
  @IsString()
  oracleAddress?: string;

  @IsOptional()
  @IsString()
  lendingTokenAddress?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  baseLtv?: number;


  @IsOptional()
  @IsNumber()
  @Min(0)
  protocolFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  apr?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  liquidity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalBorrows?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalReserves?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  utilizationRate?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

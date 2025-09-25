import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePoolDto {
  @IsString()
  address: string;

  @IsString()
  grainType: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  apr?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  liquidity?: number;
}


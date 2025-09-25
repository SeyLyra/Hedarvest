import { IsString, IsNumber, IsOptional, IsInt, Min } from 'class-validator';

export class DepositGrainDto {
  @IsInt()
  farmerId: number;

  @IsInt()
  agentId: number;

  @IsString()
  grainType: string;

  @IsNumber()
  @Min(0)
  weightKg: number;

  @IsOptional()
  @IsString()
  qualityGrade?: string;

  @IsOptional()
  @IsNumber()
  moisturePercent?: number;
}


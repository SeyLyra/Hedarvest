import { IsNumber, IsString, IsOptional } from 'class-validator';

export class VerifyDeliveryDto {
  @IsNumber()
  finalWeight: number;

  @IsString()
  finalGrade: string;

  @IsNumber()
  @IsOptional()
  moisturePercent?: number;

  @IsNumber()
  @IsOptional()
  qualityScore?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  warehouseSignature?: string;
}

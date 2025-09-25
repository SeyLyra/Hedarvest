import { IsInt, IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class ManageDepositDto {
  @IsInt()
  depositId: number;

  @IsString()
  action: 'approve' | 'reject' | 'update';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  updatedWeight?: number;

  @IsOptional()
  @IsString()
  updatedQualityGrade?: string;
}


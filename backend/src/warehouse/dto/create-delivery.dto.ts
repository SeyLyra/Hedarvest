import { IsString, IsNumber, IsOptional, IsDateString, IsArray } from 'class-validator';

export class CreateDeliveryDto {
  @IsNumber()
  farmerId: number;

  @IsString()
  warehouseId: string;

  @IsString()
  cropType: string;

  @IsString()
  @IsOptional()
  variety?: string;

  @IsNumber()
  estimatedWeight: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  estimatedGrade?: string;

  @IsNumber()
  @IsOptional()
  moistureContent?: number;

  @IsNumber()
  @IsOptional()
  temperature?: number;

  @IsDateString()
  scheduledDate: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  photos?: string[];
}

import { IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';

export class ReceiveDeliveryDto {
  @IsNumber()
  actualWeight: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  grade?: string;

  @IsString()
  priority: string; // low, medium, high

  @IsNumber()
  @IsOptional()
  estimatedValue?: number;

  @IsString()
  @IsOptional()
  storageLocation?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  arrivalDate?: string;
}

import { IsString, IsOptional } from 'class-validator';

export class UpdateDeliveryStatusDto {
  @IsString()
  status: string; // pending, confirmed, in_transit, received, completed, cancelled

  @IsString()
  @IsOptional()
  notes?: string;
}

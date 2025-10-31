import { IsString, IsOptional } from 'class-validator';

export class UpdateDeliveryStatUSDCo {
  @IsString()
  status: string; // pending, confirmed, in_transit, received, completed, cancelled

  @IsString()
  @IsOptional()
  notes?: string;
}

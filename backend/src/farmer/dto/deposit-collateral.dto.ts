import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class DepositCollateralDto {
  @IsNumber()
  @IsNotEmpty()
  farmerId: number;

  @IsString()
  @IsNotEmpty()
  cropType: string; // 'wheat', 'rice', or 'corn'

  @IsNumber()
  @IsNotEmpty()
  amount: number; // Amount of crop tokens to deposit as collateral
}

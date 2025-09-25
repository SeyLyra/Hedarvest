import { IsString, IsOptional, IsEmail, IsPhoneNumber } from 'class-validator';

export class RegisterFarmerDto {
  @IsString()
  walletAddress: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  nationalId?: string;
}


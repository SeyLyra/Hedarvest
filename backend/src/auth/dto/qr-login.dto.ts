import { IsString, IsNotEmpty } from 'class-validator';

export class QrLoginDto {
  @IsString()
  @IsNotEmpty()
  qrCode: string;

  @IsString()
  @IsNotEmpty()
  pin: string;
}


import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

export enum WalletType {
  METAMASK = 'metamask',
  HASHPACK = 'hashpack'
}

export class WalletAuthDto {
  @IsEnum(WalletType)
  @IsNotEmpty()
  walletType: WalletType;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  timestamp: string;
}

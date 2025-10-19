import { IsString, IsOptional } from 'class-validator';

export class AssociateTokenDto {
  @IsString()
  tokenId: string;

  @IsOptional()
  @IsString()
  userPrivateKey?: string;
}

export class CheckAssociationDto {
  @IsString()
  tokenId: string;
}
export class AssociateTokenWithContractDto {
  @IsString()
  tokenId: string;

  @IsString()
  contractAddress: string;
}

export class EnsureAssociationForUserAndContractDto {
  @IsString()
  tokenId: string;

  @IsString()
  contractAddress: string;

  @IsOptional()
  @IsString()
  userPrivateKey?: string;
}

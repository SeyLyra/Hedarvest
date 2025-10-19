import { Controller, Post, Body, Get, Param, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { 
  AssociateTokenDto, 
  CheckAssociationDto, 
  AssociateTokenWithContractDto,
  EnsureAssociationForUserAndContractDto 
} from './dto';

@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  /**
   * Associate a token with the authenticated user's account
   */
  @Post('associate')
  @UseGuards(JwtAuthGuard)
  async associateToken(@Request() req, @Body() associateTokenDto: AssociateTokenDto) {
    try {
      // Get user's wallet address from the JWT payload
      const userWalletAddress = req.user.walletAddress;
      if (!userWalletAddress) {
        throw new HttpException('User wallet address not found', HttpStatus.BAD_REQUEST);
      }

      const result = await this.tokensService.associateToken(
        userWalletAddress,
        associateTokenDto.tokenId,
        associateTokenDto.userPrivateKey,
      );

      return {
        success: true,
        data: result,
        message: result.alreadyAssociated 
          ? `Token ${associateTokenDto.tokenId} was already associated with account ${userWalletAddress}`
          : `Token ${associateTokenDto.tokenId} successfully associated with account ${userWalletAddress}`,
      };
    } catch (error) {
      throw new HttpException(
        {
          message: error.message || 'Failed to associate token',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Check if a token is associated with the authenticated user's account
   */
  @Get('association/:tokenId')
  @UseGuards(JwtAuthGuard)
  async checkTokenAssociation(@Request() req, @Param('tokenId') tokenId: string) {
    try {
      // Get user's wallet address from the JWT payload
      const userWalletAddress = req.user.walletAddress;
      if (!userWalletAddress) {
        throw new HttpException('User wallet address not found', HttpStatus.BAD_REQUEST);
      }

      const result = await this.tokensService.checkTokenAssociation(userWalletAddress, tokenId);

      return {
        success: true,
        data: {
          accountId: userWalletAddress,
          tokenId,
          isAssociated: result.isAssociated,
          tokenInfo: result.tokenInfo,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          message: error.message || 'Failed to check token association',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Ensure token association (associate if needed) for the authenticated user's account
   */
  @Post('ensure-association')
  @UseGuards(JwtAuthGuard)
  async ensureTokenAssociation(@Request() req, @Body() associateTokenDto: AssociateTokenDto) {
    try {
      // Get user's wallet address from the JWT payload
      const userWalletAddress = req.user.walletAddress;
      if (!userWalletAddress) {
        throw new HttpException('User wallet address not found', HttpStatus.BAD_REQUEST);
      }

      const result = await this.tokensService.ensureTokenAssociation(
        userWalletAddress,
        associateTokenDto.tokenId,
        associateTokenDto.userPrivateKey,
      );

      return {
        success: true,
        data: result,
        message: result.alreadyAssociated 
          ? `Token ${associateTokenDto.tokenId} was already associated with account ${userWalletAddress}`
          : `Token association ${result.status === 'SUCCESS' ? 'succeeded' : 'failed'} for account ${userWalletAddress}`,
      };
    } catch (error) {
      throw new HttpException(
        {
          message: error.message || 'Failed to ensure token association',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get token information
   */
  @Get('info/:tokenId')
  @UseGuards(JwtAuthGuard)
  async getTokenInfo(@Param('tokenId') tokenId: string) {
    try {
      const tokenInfo = await this.tokensService.getTokenInfo(tokenId);

      return {
        success: true,
        data: tokenInfo,
      };
    } catch (error) {
      throw new HttpException(
        {
          message: error.message || 'Failed to get token info',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Associate a token with a contract address
   */
  @Post('associate-contract')
  @UseGuards(JwtAuthGuard)
  async associateTokenWithContract(@Request() req, @Body() associateContractDto: AssociateTokenWithContractDto) {
    try {
      const result = await this.tokensService.associateTokenWithContract(
        associateContractDto.contractAddress,
        associateContractDto.tokenId,
      );

      return {
        success: true,
        data: result,
        message: result.alreadyAssociated 
          ? `Token ${associateContractDto.tokenId} was already associated with contract ${associateContractDto.contractAddress}`
          : `Token ${associateContractDto.tokenId} successfully associated with contract ${associateContractDto.contractAddress}`,
      };
    } catch (error) {
      throw new HttpException(
        {
          message: error.message || 'Failed to associate token with contract',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Ensure token association for both user and contract addresses
   */
  @Post('ensure-association-user-contract')
  @UseGuards(JwtAuthGuard)
  async ensureTokenAssociationForUserAndContract(@Request() req, @Body() ensureDto: EnsureAssociationForUserAndContractDto) {
    try {
      // Get user's wallet address from the JWT payload
      const userWalletAddress = req.user.walletAddress;
      if (!userWalletAddress) {
        throw new HttpException('User wallet address not found', HttpStatus.BAD_REQUEST);
      }

      const result = await this.tokensService.ensureTokenAssociationForUserAndContract(
        userWalletAddress,
        ensureDto.contractAddress,
        ensureDto.tokenId,
        ensureDto.userPrivateKey,
      );

      return {
        success: true,
        data: result,
        message: `Token ${ensureDto.tokenId} association ensured for user ${userWalletAddress} and contract ${ensureDto.contractAddress}`,
      };
    } catch (error) {
      throw new HttpException(
        {
          message: error.message || 'Failed to ensure token association for user and contract',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

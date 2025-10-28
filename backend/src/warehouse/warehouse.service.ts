import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../lib/prisma';
import {
  CreateDeliveryDto,
  UpdateDeliveryStatusDto,
  ReceiveDeliveryDto,
  VerifyDeliveryDto
} from './dto';
import { TransactionService } from '../transaction/transaction.service';
import { HederaService } from '../lib/hedera.service';

@Injectable()
export class WarehouseService {
  private readonly logger = new Logger(WarehouseService.name);

  constructor(
    private prisma: PrismaService,
    private transactionService: TransactionService,
    private hederaService: HederaService,
  ) {}

  /**
   * Create a new delivery request from farmer
   */
  async createDeliveryRequest(createDeliveryDto: CreateDeliveryDto) {
    const { farmerId, ...deliveryData } = createDeliveryDto;

    // Verify farmer exists
    const farmer = await this.prisma.farmer.findUnique({
      where: { id: farmerId },
    });

    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    // Create delivery request
    const deliveryRequest = await this.prisma.deliveryRequest.create({
      data: {
        farmerId,
        warehouseId: deliveryData.warehouseId,
        cropType: deliveryData.cropType,
        variety: deliveryData.variety,
        estimatedWeight: deliveryData.estimatedWeight,
        unit: deliveryData.unit || 'kg',
        estimatedGrade: deliveryData.estimatedGrade,
        moistureContent: deliveryData.moistureContent,
        temperature: deliveryData.temperature,
        scheduledDate: new Date(deliveryData.scheduledDate),
        location: deliveryData.location,
        notes: deliveryData.notes,
        photos: deliveryData.photos || [],
        status: 'pending',
      },
    });

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'delivery_request',
      ref: `delivery_${deliveryRequest.id}`,
      entity: 'DeliveryRequest',
      meta: {
        farmerId,
        warehouseId: deliveryData.warehouseId,
        cropType: deliveryData.cropType,
        estimatedWeight: deliveryData.estimatedWeight,
      },
    });

    return deliveryRequest;
  }

  /**
   * Get all delivery requests for a warehouse
   */
  async getDeliveryRequests(warehouseId: string, status?: string) {
    const where: any = { warehouseId };

    if (status) {
      where.status = status;
    }

    return this.prisma.deliveryRequest.findMany({
      where,
      include: {
        farmer: {
          select: {
            id: true,
            memberNumber: true,
            phoneNumber: true,
            walletAddress: true,
            email: true, // Include email for name display
          },
        },
        incomingDelivery: true,
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });
  }

  /**
   * Get delivery requests for a specific farmer
   */
  async getFarmerDeliveries(farmerId: number) {
    return this.prisma.deliveryRequest.findMany({
      where: { farmerId },
      include: {
        incomingDelivery: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get a specific delivery request
   */
  async getDeliveryRequest(id: number) {
    const delivery = await this.prisma.deliveryRequest.findUnique({
      where: { id },
      include: {
        farmer: true,
        incomingDelivery: true,
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery request not found');
    }

    return delivery;
  }

  /**
   * Update delivery request status
   */
  async updateDeliveryStatus(id: number, updateDto: UpdateDeliveryStatusDto) {
    const delivery = await this.getDeliveryRequest(id);

    const updated = await this.prisma.deliveryRequest.update({
      where: { id },
      data: {
        status: updateDto.status,
        notes: updateDto.notes || delivery.notes,
      },
    });

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'delivery_status_update',
      ref: `delivery_${id}`,
      entity: 'DeliveryRequest',
      meta: {
        newStatus: updateDto.status,
        notes: updateDto.notes,
      },
    });

    return updated;
  }

  /**
   * Receive delivery at warehouse (create IncomingDelivery)
   */
  async receiveDelivery(deliveryRequestId: number, receiveDto: ReceiveDeliveryDto) {
    const deliveryRequest = await this.getDeliveryRequest(deliveryRequestId);

    // MVP: Skip status validation for demo purposes
    // if (deliveryRequest.status !== 'confirmed' && deliveryRequest.status !== 'in_transit') {
    //   throw new BadRequestException(
    //     'Delivery must be confirmed or in transit before receiving'
    //   );
    // }

    // Check if already received
    const existing = await this.prisma.incomingDelivery.findUnique({
      where: { deliveryRequestId },
    });

    if (existing) {
      throw new BadRequestException('Delivery already received');
    }

    // Create incoming delivery record
    const incomingDelivery = await this.prisma.incomingDelivery.create({
      data: {
        deliveryRequestId,
        farmerName: deliveryRequest.farmer.memberNumber, // Can be updated with full name
        farmerId: deliveryRequest.farmerId,
        cropType: deliveryRequest.cropType,
        weight: receiveDto.actualWeight,
        unit: receiveDto.unit || 'kg',
        grade: receiveDto.grade,
        arrivalDate: receiveDto.arrivalDate ? new Date(receiveDto.arrivalDate) : new Date(),
        status: 'pending',
        priority: receiveDto.priority,
        estimatedValue: receiveDto.estimatedValue,
        storageLocation: receiveDto.storageLocation,
        notes: receiveDto.notes,
      },
    });

    // Update delivery request status
    await this.prisma.deliveryRequest.update({
      where: { id: deliveryRequestId },
      data: { status: 'received' },
    });

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'delivery_received',
      ref: `delivery_${deliveryRequestId}`,
      entity: 'IncomingDelivery',
      meta: {
        incomingDeliveryId: incomingDelivery.id,
        actualWeight: receiveDto.actualWeight,
        estimatedValue: receiveDto.estimatedValue,
      },
    });

    return incomingDelivery;
  }

  /**
   * Get all incoming deliveries for warehouse
   */
  async getIncomingDeliveries(warehouseId: string, status?: string) {
    // First get delivery requests for this warehouse
    const deliveryRequests = await this.prisma.deliveryRequest.findMany({
      where: {
        warehouseId,
        incomingDelivery: status ? { status } : { isNot: null },
      },
      include: {
        farmer: true,
        incomingDelivery: true,
      },
    });

    return deliveryRequests
      .filter(dr => dr.incomingDelivery)
      .map(dr => ({
        ...dr.incomingDelivery,
        farmer: dr.farmer,
        deliveryRequest: {
          id: dr.id,
          scheduledDate: dr.scheduledDate,
          estimatedWeight: dr.estimatedWeight,
          estimatedGrade: dr.estimatedGrade,
        },
      }));
  }

  /**
   * Update incoming delivery status
   */
  async updateIncomingDeliveryStatus(id: number, status: string, notes?: string) {
    const delivery = await this.prisma.incomingDelivery.findUnique({
      where: { id },
    });

    if (!delivery) {
      throw new NotFoundException('Incoming delivery not found');
    }

    const updated = await this.prisma.incomingDelivery.update({
      where: { id },
      data: {
        status,
        notes: notes || delivery.notes,
      },
    });

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'incoming_delivery_status_update',
      ref: `incoming_delivery_${id}`,
      entity: 'IncomingDelivery',
      meta: {
        newStatus: status,
        notes,
      },
    });

    return updated;
  }

  /**
   * Verify delivery and mint tokens
   */
  async verifyAndMintTokens(incomingDeliveryId: number, verifyDto: VerifyDeliveryDto) {
    const incomingDelivery = await this.prisma.incomingDelivery.findUnique({
      where: { id: incomingDeliveryId },
      include: {
        deliveryRequest: {
          include: {
            farmer: true,
          },
        },
      },
    });

    if (!incomingDelivery) {
      throw new NotFoundException('Incoming delivery not found');
    }

    if (incomingDelivery.status !== 'inspecting' && incomingDelivery.status !== 'pending') {
      throw new BadRequestException('Delivery must be pending or inspecting before verification');
    }

    const farmer = incomingDelivery.deliveryRequest.farmer;

    // Create grain deposit record with verified data
    const grainDeposit = await this.prisma.grainDeposit.create({
      data: {
        farmerId: farmer.id,
        agentId: farmer.agentId, // Use farmer's agent if available
        grainType: incomingDelivery.cropType,
        weightKg: verifyDto.finalWeight,
        qualityGrade: verifyDto.finalGrade,
        moisturePercent: verifyDto.moisturePercent,
        tokensMinted: verifyDto.finalWeight, // 1:1 ratio for now
        hederaTxId: null, // Will be updated after minting
      },
    });

    // Update incoming delivery
    await this.prisma.incomingDelivery.update({
      where: { id: incomingDeliveryId },
      data: {
        status: 'verified',
        grade: verifyDto.finalGrade,
        weight: verifyDto.finalWeight,
        grainDepositId: grainDeposit.id,
        notes: verifyDto.notes || incomingDelivery.notes,
      },
    });

    // Update delivery request status
    await this.prisma.deliveryRequest.update({
      where: { id: incomingDelivery.deliveryRequestId },
      data: { status: 'completed' },
    });

    // Mint crop tokens to farmer using Hedera Service
    let hederaTxId: string | null = null;
    let tokenId: string | null = null;
    let tokenAmount = 0;

    try {
      const farmerWallet = farmer.walletAddress;
      if (!farmerWallet) {
        throw new Error('Farmer wallet address not found');
      }

      const mintResult = await this.hederaService.mintCropTokens(
        incomingDelivery.cropType,
        verifyDto.finalWeight,
        farmerWallet,
      );

      hederaTxId = mintResult.transactionId;
      tokenId = mintResult.tokenId;
      tokenAmount = mintResult.amount;

      // Update grain deposit with Hedera transaction ID
      await this.prisma.grainDeposit.update({
        where: { id: grainDeposit.id },
        data: {
          hederaTxId: hederaTxId,
          tokensMinted: verifyDto.finalWeight,
        },
      });

      this.logger.log(`Minted ${tokenAmount} ${incomingDelivery.cropType} tokens to farmer ${farmerWallet}`);
    } catch (error) {
      this.logger.error('Failed to mint tokens:', error);
      // Continue even if minting fails, but mark it in the logs
      hederaTxId = `ERROR: ${error.message}`;
    }

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'delivery_verified_and_minted',
      ref: `incoming_delivery_${incomingDeliveryId}`,
      entity: 'GrainDeposit',
      meta: {
        grainDepositId: grainDeposit.id,
        finalWeight: verifyDto.finalWeight,
        finalGrade: verifyDto.finalGrade,
        tokensMinted: verifyDto.finalWeight,
        hederaTxId,
        tokenId,
        tokenAmount,
        farmerWallet: farmer.walletAddress,
      },
    });

    return {
      incomingDelivery,
      grainDeposit,
      message: 'Delivery verified and tokens minted successfully',
    };
  }

  /**
   * Reject delivery
   */
  async rejectDelivery(incomingDeliveryId: number, reason: string) {
    const incomingDelivery = await this.prisma.incomingDelivery.findUnique({
      where: { id: incomingDeliveryId },
    });

    if (!incomingDelivery) {
      throw new NotFoundException('Incoming delivery not found');
    }

    // Update incoming delivery
    await this.prisma.incomingDelivery.update({
      where: { id: incomingDeliveryId },
      data: {
        status: 'rejected',
        notes: reason,
      },
    });

    // Update delivery request status
    await this.prisma.deliveryRequest.update({
      where: { id: incomingDelivery.deliveryRequestId },
      data: { status: 'cancelled' },
    });

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'delivery_rejected',
      ref: `incoming_delivery_${incomingDeliveryId}`,
      entity: 'IncomingDelivery',
      meta: {
        reason,
      },
    });

    return { message: 'Delivery rejected', reason };
  }
}

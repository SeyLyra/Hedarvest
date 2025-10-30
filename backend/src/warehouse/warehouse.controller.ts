import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import {
  CreateDeliveryDto,
  UpdateDeliveryStatusDto,
  ReceiveDeliveryDto,
  VerifyDeliveryDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { WAREHOUSES } from './warehouses.constant';

@Controller('warehouse')
export class WarehouseController {
  constructor(
    private readonly warehouseService: WarehouseService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Warehouse operator login
   */
  @Post('login')
  async warehouseLogin(@Body() body: { email: string; password: string }) {
    const warehouseData = await this.warehouseService.warehouseLogin(
      body.email,
      body.password,
    );

    // Create a JWT token with warehouse information
    const payload = {
      sub: 'warehouse_operator',
      email: warehouseData.warehouse.email,
      warehouseId: warehouseData.warehouse.id,
      role: 'warehouse_operator',
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      warehouse: {
        id: warehouseData.warehouse.id,
        name: warehouseData.warehouse.name,
        operator: warehouseData.warehouse.manager || 'Warehouse Operator',
      },
    };
  }

  /**
   * Get all available warehouses
   */
  @Get('list')
  async getWarehouses() {
    // For demo, only return WH001 (Green Valley Storage)
    return WAREHOUSES.filter((w) => w.id === 'WH001');
  }

  /**
   * Create a new delivery (called by farmer)
   */
  @Post('deliveries')
  @UseGuards(JwtAuthGuard)
  async createDeliveryRequest(@Body() createDeliveryDto: CreateDeliveryDto) {
    return this.warehouseService.createDeliveryRequest(createDeliveryDto);
  }

  /**
   * Get all deliveries for a warehouse
   */
  @Get('deliveries')
  @UseGuards(JwtAuthGuard)
  async getDeliveryRequests(@Request() req, @Query('status') status?: string) {
    // Extract warehouse ID from JWT token
    const warehouseId = req.user.warehouseId || 'WH001'; // Default for demo
    return this.warehouseService.getDeliveryRequests(warehouseId, status);
  }

  /**
   * Get deliveries for a specific farmer
   */
  @Get('deliveries/farmer/:farmerId')
  @UseGuards(JwtAuthGuard)
  async getFarmerDeliveries(@Param('farmerId', ParseIntPipe) farmerId: number) {
    return this.warehouseService.getFarmerDeliveries(farmerId);
  }

  /**
   * Update delivery status
   */
  @Put('deliveries/:id/status')
  async updateDeliveryStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDeliveryStatusDto,
  ) {
    return this.warehouseService.updateDeliveryStatus(id, updateDto);
  }

  /**
   * Receive delivery at warehouse (update Delivery with arrival)
   */
  @Post('deliveries/:id/receive')
  async receiveDelivery(
    @Param('id', ParseIntPipe) id: number,
    @Body() receiveDto: ReceiveDeliveryDto,
  ) {
    return this.warehouseService.receiveDelivery(id, receiveDto);
  }


  /**
   * Update delivery status (post-arrival)
   */
  @Put('deliveries/:id/status/received')
  async updateIncomingDeliveryStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string; notes?: string },
  ) {
    return this.warehouseService.updateIncomingDeliveryStatus(
      id,
      body.status,
      body.notes,
    );
  }

  /**
   * Verify delivery and mint tokens
   */
  @Post('deliveries/:id/verify')
  async verifyAndMintTokens(
    @Param('id', ParseIntPipe) id: number,
    @Body() verifyDto: VerifyDeliveryDto,
  ) {
    return this.warehouseService.verifyAndMintTokens(id, verifyDto);
  }

  /**
   * Get issued receipts (grain deposits) for warehouse
   */
  @Get('issued-receipts')
  @UseGuards(JwtAuthGuard)
  async getIssuedReceipts(@Request() req, @Query('status') status?: string) {
    // Extract warehouse ID from JWT token
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const warehouseId = req.user.warehouseId || 'WH001'; // Default for demo
    return this.warehouseService.getIssuedReceipts(warehouseId, status);
  }

  /**
   * Get warehouse by ID (MUST be last to avoid catching other routes)
   */
  // removed unused GET :id
}

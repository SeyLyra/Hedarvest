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
    const warehouseData = await this.warehouseService.warehouseLogin(body.email, body.password);
    
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
    return WAREHOUSES.filter(w => w.id === 'WH001');
  }

  /**
   * Create a new delivery request (called by farmer)
   */
  @Post('delivery-requests')
  @UseGuards(JwtAuthGuard)
  async createDeliveryRequest(@Body() createDeliveryDto: CreateDeliveryDto) {
    return this.warehouseService.createDeliveryRequest(createDeliveryDto);
  }

  /**
   * Get all delivery requests for a warehouse
   */
  @Get('delivery-requests')
  @UseGuards(JwtAuthGuard)
  async getDeliveryRequests(
    @Request() req,
    @Query('status') status?: string,
  ) {
    // Extract warehouse ID from JWT token
    const warehouseId = req.user.warehouseId || 'WH001'; // Default for demo
    return this.warehouseService.getDeliveryRequests(warehouseId, status);
  }

  /**
   * Get delivery requests for a specific farmer
   */
  @Get('delivery-requests/farmer/:farmerId')
  @UseGuards(JwtAuthGuard)
  async getFarmerDeliveries(@Param('farmerId', ParseIntPipe) farmerId: number) {
    return this.warehouseService.getFarmerDeliveries(farmerId);
  }

  /**
   * Get a specific delivery request
   */
  @Get('delivery-requests/:id')
  async getDeliveryRequest(@Param('id', ParseIntPipe) id: number) {
    return this.warehouseService.getDeliveryRequest(id);
  }

  /**
   * Update delivery request status
   */
  @Put('delivery-requests/:id/status')
  async updateDeliveryStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDeliveryStatusDto,
  ) {
    return this.warehouseService.updateDeliveryStatus(id, updateDto);
  }

  /**
   * Receive delivery at warehouse (creates IncomingDelivery)
   */
  @Post('delivery-requests/:id/receive')
  async receiveDelivery(
    @Param('id', ParseIntPipe) id: number,
    @Body() receiveDto: ReceiveDeliveryDto,
  ) {
    return this.warehouseService.receiveDelivery(id, receiveDto);
  }

  /**
   * Get all incoming deliveries for warehouse
   */
  @Get('incoming-deliveries')
  @UseGuards(JwtAuthGuard)
  async getIncomingDeliveries(
    @Request() req,
    @Query('status') status?: string,
  ) {
    // Extract warehouse ID from JWT token
    const warehouseId = req.user.warehouseId || 'WH001'; // Default for demo
    return this.warehouseService.getIncomingDeliveries(warehouseId, status);
  }

  /**
   * Update incoming delivery status
   */
  @Put('incoming-deliveries/:id/status')
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
  @Post('incoming-deliveries/:id/verify')
  async verifyAndMintTokens(
    @Param('id', ParseIntPipe) id: number,
    @Body() verifyDto: VerifyDeliveryDto,
  ) {
    return this.warehouseService.verifyAndMintTokens(id, verifyDto);
  }

  /**
   * Reject delivery
   */
  @Post('incoming-deliveries/:id/reject')
  async rejectDelivery(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string },
  ) {
    return this.warehouseService.rejectDelivery(id, body.reason);
  }

  /**
   * Get issued receipts (grain deposits) for warehouse
   */
  @Get('issued-receipts')
  @UseGuards(JwtAuthGuard)
  async getIssuedReceipts(
    @Request() req,
    @Query('status') status?: string,
  ) {
    // Extract warehouse ID from JWT token
    const warehouseId = req.user.warehouseId || 'WH001'; // Default for demo
    return this.warehouseService.getIssuedReceipts(warehouseId, status);
  }

  /**
   * Get warehouse by ID (MUST be last to avoid catching other routes)
   */
  @Get(':id')
  async getWarehouseById(@Param('id') id: string) {
    const warehouse = WAREHOUSES.find((w) => w.id === id);
    if (!warehouse) {
      return { error: 'Warehouse not found' };
    }
    return warehouse;
  }
}

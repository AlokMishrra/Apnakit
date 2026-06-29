import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CreateTicketDto, UpdateTicketDto, CreateTicketMessageDto } from './dto/support.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Role } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @UseGuards(JwtAuthGuard)
  @Post('tickets')
  @ApiOperation({ summary: 'Create a new support ticket' })
  @ApiBearerAuth()
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateTicketDto,
  ) {
    return this.supportService.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tickets')
  @ApiOperation({ summary: 'Get my tickets' })
  @ApiBearerAuth()
  getMyTickets(@CurrentUser() user: CurrentUserData) {
    return this.supportService.findByUser(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/tickets')
  @ApiOperation({ summary: 'Get all tickets (Admin)' })
  @ApiBearerAuth()
  getAllTickets(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.supportService.findAll({ status, priority, page, limit });
  }

  @UseGuards(JwtAuthGuard)
  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiBearerAuth()
  getTicket(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.supportService.findOne(id, user.id, user.role === Role.ADMIN);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('tickets/:id')
  @ApiOperation({ summary: 'Update ticket (Admin)' })
  @ApiBearerAuth()
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.supportService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tickets/:id/messages')
  @ApiOperation({ summary: 'Get ticket messages' })
  @ApiBearerAuth()
  getMessages(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.supportService.getMessages(id, user.id, user.role === Role.ADMIN);
  }

  @UseGuards(JwtAuthGuard)
  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Add message to ticket' })
  @ApiBearerAuth()
  addMessage(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateTicketMessageDto,
  ) {
    return this.supportService.addMessage(id, user.id, dto);
  }
}

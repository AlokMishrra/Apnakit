import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HomeSectionKey } from '@prisma/client';
import { HomeSectionsService } from './home-sections.service';
import {
  ReplaceHomeSectionItemsDto,
  UpdateHomeSectionDto,
  AddHomeSectionItemDto,
  ReplaceHomeSectionCategoriesDto,
  AddHomeSectionCategoryDto,
} from './dto/home-section.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Role } from '../../common/guards/roles.guard';
import { Roles, Public } from '../../common/decorators/roles.decorator';

/** Parses the `:key` path param and rejects anything outside the enum. */
const SectionKeys = Object.values(HomeSectionKey);

function assertKey(key: string): HomeSectionKey {
  if (!SectionKeys.includes(key as HomeSectionKey)) {
    throw new BadRequestException(
      `Invalid home section key "${key}". Expected one of: ${SectionKeys.join(', ')}`,
    );
  }
  return key as HomeSectionKey;
}

@ApiTags('Home Sections')
@Controller('home-sections')
export class HomeSectionsController {
  constructor(private readonly homeSectionsService: HomeSectionsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List section metadata (used to render the toggle)' })
  findAll() {
    return this.homeSectionsService.findAll();
  }

  @Public()
  @Get(':key')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Get one section with its products (public)' })
  findByKey(@Param('key') key: string, @Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.homeSectionsService.findActiveSection(assertKey(key), limit);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Get(':key/admin')
  @ApiOperation({ summary: 'Get one section including inactive items (Admin)' })
  findAdminSection(@Param('key') key: string) {
    return this.homeSectionsService.findAdminSection(assertKey(key));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Patch(':key')
  @ApiOperation({ summary: 'Update section copy / visibility (Admin)' })
  updateSection(@Param('key') key: string, @Body() dto: UpdateHomeSectionDto) {
    return this.homeSectionsService.updateSection(assertKey(key), dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Put(':key/items')
  @ApiOperation({ summary: 'Replace the whole ordered product list (Admin)' })
  replaceItems(@Param('key') key: string, @Body() dto: ReplaceHomeSectionItemsDto) {
    return this.homeSectionsService.replaceItems(assertKey(key), dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Post(':key/items')
  @ApiOperation({ summary: 'Add a product to a section (Admin)' })
  addItem(@Param('key') key: string, @Body() dto: AddHomeSectionItemDto) {
    return this.homeSectionsService.addItem(assertKey(key), dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Delete(':key/items/:productId')
  @ApiOperation({ summary: 'Remove a product from a section (Admin)' })
  removeItem(@Param('key') key: string, @Param('productId') productId: string) {
    return this.homeSectionsService.removeItem(assertKey(key), productId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Put(':key/categories')
  @ApiOperation({ summary: 'Replace the pinned category list (Admin)' })
  replaceCategories(
    @Param('key') key: string,
    @Body() dto: ReplaceHomeSectionCategoriesDto,
  ) {
    return this.homeSectionsService.replaceCategories(assertKey(key), dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Post(':key/categories')
  @ApiOperation({ summary: 'Pin a category to a section (Admin)' })
  addCategory(@Param('key') key: string, @Body() dto: AddHomeSectionCategoryDto) {
    return this.homeSectionsService.addCategory(assertKey(key), dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Delete(':key/categories/:categoryId')
  @ApiOperation({ summary: 'Unpin a category from a section (Admin)' })
  removeCategory(@Param('key') key: string, @Param('categoryId') categoryId: string) {
    return this.homeSectionsService.removeCategory(assertKey(key), categoryId);
  }
}
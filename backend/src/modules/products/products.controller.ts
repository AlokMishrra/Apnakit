import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UploadedFile,
  UploadedFiles,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { UpdateVariantsDto } from './dto/update-variants.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Role } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/roles.decorator';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @ApiBearerAuth()
  @Get('admin/stats')
  @ApiOperation({ summary: 'Get product stats (admin/seller)' })
  @ApiResponse({ status: 200, description: 'Product stats' })
  getAdminStats(@CurrentUser() user: CurrentUserData) {
    return this.productsService.getAdminStats(user.id, user.role);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List products with filtering, sorting, and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of products' })
  findAll(@Query() query: FilterProductDto) {
    return this.productsService.findAll(query);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Featured products' })
  findFeatured(@Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : undefined;
    return this.productsService.findFeatured(parsed);
  }

  @Public()
  @Get('trending')
  @ApiOperation({ summary: 'Get trending products based on recent orders' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Trending products' })
  findTrending(@Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : undefined;
    return this.productsService.findTrending(parsed);
  }

  @Public()
  @Get('bestsellers')
  @ApiOperation({ summary: 'Get best selling products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Best selling products' })
  findBestsellers(@Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : undefined;
    return this.productsService.findBestsellers(parsed);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a single product by slug' })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single product with all relations' })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Public()
  @Get(':id/related')
  @ApiOperation({ summary: 'Get related products by category' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Related products' })
  findRelated(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.findRelated(id, limit);
  }

  @Public()
  @Get(':id/similar')
  @ApiOperation({ summary: 'Get similar products by category and brand' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Similar products' })
  findSimilar(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.findSimilar(id, limit);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new product (Seller only)' })
  @ApiResponse({ status: 201, description: 'Product created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.productsService.create(dto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update a product (Seller only)' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product (Seller only)' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @ApiBearerAuth()
  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload product images' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Images uploaded' })
  uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productsService.uploadImages(id, files);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @ApiBearerAuth()
  @Post(':id/images/urls')
  @ApiOperation({ summary: 'Add product images by URL' })
  @ApiResponse({ status: 201, description: 'Images added' })
  addImagesByUrls(
    @Param('id') id: string,
    @Body() body: { urls: string[]; alt?: string },
  ) {
    return this.productsService.addImagesByUrls(id, body.urls, body.alt);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @ApiBearerAuth()
  @Delete(':id/images/:imageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product image' })
  @ApiResponse({ status: 200, description: 'Image deleted' })
  deleteImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productsService.deleteImage(id, imageId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @ApiBearerAuth()
  @Patch(':id/images/primary')
  @ApiOperation({ summary: 'Set primary product image' })
  @ApiResponse({ status: 200, description: 'Primary image set' })
  setPrimaryImage(
    @Param('id') id: string,
    @Body() body: { imageId: string },
  ) {
    return this.productsService.setPrimaryImage(id, body.imageId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @ApiBearerAuth()
  @Delete(':id/images')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete multiple product images' })
  @ApiResponse({ status: 200, description: 'Images deleted' })
  deleteImages(
    @Param('id') id: string,
    @Body() body: { imageIds: string[] },
  ) {
    return this.productsService.deleteImages(id, body.imageIds);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @ApiBearerAuth()
  @Patch(':id/variants')
  @ApiOperation({ summary: 'Upsert product variants' })
  @ApiResponse({ status: 200, description: 'Variants updated' })
  updateVariants(
    @Param('id') id: string,
    @Body() dto: UpdateVariantsDto,
  ) {
    return this.productsService.updateVariants(id, dto);
  }
}

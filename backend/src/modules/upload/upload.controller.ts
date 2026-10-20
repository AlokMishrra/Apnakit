import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { UploadService, UploadKind, UPLOAD_KIND_SPECS } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../../config/database.config';

const UPLOAD_KINDS = Object.keys(UPLOAD_KIND_SPECS) as UploadKind[];

class PresignUploadDto {
  @IsIn(UPLOAD_KINDS)
  kind: UploadKind;

  @IsString()
  @MaxLength(255)
  fileName: string;

  @IsString()
  @MaxLength(255)
  contentType: string;

  @IsOptional()
  size?: number;
}

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('presign')
  @ApiOperation({
    summary:
      'Get a direct-to-storage upload ticket. Required for files too large for the 4.5MB API request cap (video, APK, IPA).',
  })
  presignUpload(@Body() dto: PresignUploadDto) {
    return this.uploadService.createDirectUpload({
      kind: dto.kind,
      fileName: dto.fileName,
      contentType: dto.contentType,
      size: dto.size,
    });
  }

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a single image' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadImage(file);
  }

  @Post('video')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a single video (mp4/webm/ogg/mov, up to 50MB)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  uploadVideo(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadVideo(file);
  }

  @Post('app-icon')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload app icon (PNG/JPEG/WebP/SVG, up to 2MB)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  uploadAppIcon(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadAppIcon(file);
  }

  @Post('apk')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload Android APK or AAB file (up to 200MB)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  uploadApk(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadApk(file);
  }

  @Post('ipa')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload iOS IPA file (up to 300MB)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  uploadIpa(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadIpa(file);
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple images' })
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
  uploadMultipleImages(@UploadedFiles() files: Express.Multer.File[]) {
    return this.uploadService.uploadMultipleImages(files);
  }

  @Delete(':key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an uploaded file' })
  deleteFile(@Param('key') key: string) {
    return this.uploadService.deleteFile(key);
  }

  @Get('storage-status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Check which storage provider is active' })
  async storageStatus() {
    return this.uploadService.getStorageStatus();
  }

  @Get('broken-images')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Find all product images with broken local URLs' })
  async findBrokenImages() {
    const images = await this.prisma.productImage.findMany({
      where: {
        url: { contains: 'apnakit-backend.onrender.com/uploads' },
      },
      select: {
        id: true,
        url: true,
        productId: true,
        product: { select: { name: true, slug: true } },
      },
    });
    return { brokenCount: images.length, images };
  }

  @Post('fix-broken-images')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete broken local image records (files lost on Render)' })
  async fixBrokenImages() {
    const result = await this.prisma.productImage.deleteMany({
      where: {
        url: { contains: 'apnakit-backend.onrender.com/uploads' },
      },
    });
    return { deletedCount: result.count, message: 'Broken image records deleted. Please re-upload product images via admin panel.' };
  }
}

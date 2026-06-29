import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private useS3: boolean;
  private s3: any = null;
  private bucketName: string;
  private s3Initialized = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.bucketName = this.configService.get('AWS_S3_BUCKET', 'nishumart-uploads');
    this.useS3 = false;
  }

  private async initS3() {
    if (this.s3Initialized) return;
    this.s3Initialized = true;

    const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID') || this.configService.get('AWS_ACCESS_KEY');
    const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY') || this.configService.get('AWS_SECRET_KEY');
    const region = this.configService.get('AWS_REGION', 'ap-south-1');

    if (
      !accessKeyId ||
      !secretAccessKey ||
      accessKeyId === 'your-aws-access-key' ||
      secretAccessKey === 'your-aws-secret-key' ||
      accessKeyId.startsWith('your-') ||
      secretAccessKey.startsWith('your-')
    ) {
      this.logger.log('AWS credentials not configured. Using local file storage.');
      this.useS3 = false;
      return;
    }

    try {
      const AWS = await import('aws-sdk');
      this.s3 = new AWS.S3({
        accessKeyId,
        secretAccessKey,
        region,
      });
      this.useS3 = true;
      this.logger.log('Using AWS S3 for file storage');
    } catch (err) {
      this.logger.warn('Failed to initialize AWS S3. Falling back to local storage.');
      this.useS3 = false;
    }
  }

  async uploadImage(file: Express.Multer.File, folder = 'uploads') {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: JPEG, PNG, WebP, GIF');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    await this.initS3();

    if (this.useS3 && this.s3) {
      return this.uploadToS3(file, folder);
    }
    return this.uploadToLocal(file, folder);
  }

  async uploadVideo(file: Express.Multer.File, folder = 'uploads') {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid video type. Allowed: MP4, WebM, OGG, MOV');
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new BadRequestException('Video size exceeds 50MB limit');
    }

    await this.initS3();

    if (this.useS3 && this.s3) {
      return this.uploadToS3(file, folder);
    }
    return this.uploadToLocal(file, folder);
  }

  async uploadAppIcon(file: Express.Multer.File, folder = 'apps/icons') {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const allowedMimes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid icon type. Allowed: PNG, JPEG, WebP, SVG');
    }
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Icon size exceeds 2MB limit');
    }
    await this.initS3();
    if (this.useS3 && this.s3) {
      return this.uploadToS3(file, folder);
    }
    return this.uploadToLocal(file, folder);
  }

  async uploadApk(file: Express.Multer.File, folder = 'apps/android') {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const ext = (file.originalname || '').toLowerCase();
    const allowedExts = ['.apk', '.aab'];
    const allowedMimes = [
      'application/vnd.android.package-archive',
      'application/x-apk',
      'application/octet-stream',
    ];
    const extOk = allowedExts.some((e) => ext.endsWith(e));
    const mimeOk = allowedMimes.includes(file.mimetype);
    if (!extOk && !mimeOk) {
      throw new BadRequestException('Invalid Android package file. Allowed: .apk, .aab');
    }
    const maxSize = 200 * 1024 * 1024; // 200MB
    if (file.size > maxSize) {
      throw new BadRequestException('APK size exceeds 200MB limit');
    }
    await this.initS3();
    if (this.useS3 && this.s3) {
      return this.uploadToS3(file, folder);
    }
    return this.uploadToLocal(file, folder);
  }

  async uploadIpa(file: Express.Multer.File, folder = 'apps/ios') {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const ext = (file.originalname || '').toLowerCase();
    const allowedExts = ['.ipa', '.pkg'];
    const allowedMimes = [
      'application/octet-stream',
      'application/x-itunes-ipa',
      'application/x-apple-pkg',
    ];
    const extOk = allowedExts.some((e) => ext.endsWith(e));
    const mimeOk = allowedMimes.includes(file.mimetype);
    if (!extOk && !mimeOk) {
      throw new BadRequestException('Invalid iOS package file. Allowed: .ipa, .pkg');
    }
    const maxSize = 300 * 1024 * 1024; // 300MB
    if (file.size > maxSize) {
      throw new BadRequestException('IPA size exceeds 300MB limit');
    }
    await this.initS3();
    if (this.useS3 && this.s3) {
      return this.uploadToS3(file, folder);
    }
    return this.uploadToLocal(file, folder);
  }

  private async uploadToS3(file: Express.Multer.File, folder: string) {
    const key = `${folder}/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    try {
      const result = await this.s3
        .upload({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        })
        .promise();
      this.logger.log(`File uploaded to S3: ${key}`);
      return {
        url: result.Location,
        key: result.Key,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      this.logger.error('S3 upload failed, falling back to local', error);
      return this.uploadToLocal(file, folder);
    }
  }

  private async uploadToLocal(file: Express.Multer.File, folder: string) {
    const ext = path.extname(file.originalname) || this.getExtFromMime(file.mimetype);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '-');
    const fileName = `${Date.now()}-${baseName}${ext}`;
    // Files are served from <cwd>/uploads/ via useStaticAssets prefix '/uploads'
    // So we write to <cwd>/uploads/<folder>/<fileName> and return URL /uploads/<folder>/<fileName>
    const uploadDir = path.join(process.cwd(), 'uploads', folder);
    const filePath = path.join(uploadDir, fileName);

    try {
      await mkdir(uploadDir, { recursive: true });
      await writeFile(filePath, file.buffer);
      this.logger.log(`File saved locally: ${filePath}`);

      // Build the public URL based on env
      const publicHost =
        this.configService.get('PUBLIC_BACKEND_URL') ||
        this.configService.get('API_BASE_URL') ||
        `http://localhost:${process.env.PORT || 3000}`;
      const url = `${publicHost.replace(/\/$/, '')}/uploads/${folder}/${fileName}`;

      return {
        url,
        key: `${folder}/${fileName}`,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      this.logger.error('Local upload failed', error);
      throw new BadRequestException('File upload failed');
    }
  }

  private getExtFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/ogg': '.ogv',
      'video/quicktime': '.mov',
    };
    return map[mime] || '.bin';
  }

  async uploadMultipleImages(files: Express.Multer.File[], folder = 'uploads') {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const results = await Promise.all(
      files.map((file) => this.uploadImage(file, folder)),
    );

    return results;
  }

  async deleteFile(key: string) {
    if (!key) {
      throw new BadRequestException('No key provided');
    }

    await this.initS3();

    if (this.useS3 && this.s3) {
      try {
        await this.s3
          .deleteObject({ Bucket: this.bucketName, Key: key })
          .promise();
        this.logger.log(`File deleted from S3: ${key}`);
        return { message: 'File deleted successfully' };
      } catch (error) {
        this.logger.error('S3 delete failed', error);
        throw new BadRequestException('File deletion failed');
      }
    }

    // Local delete
    try {
      const filePath = path.join(process.cwd(), 'uploads', key);
      if (fs.existsSync(filePath)) {
        await unlink(filePath);
        this.logger.log(`File deleted locally: ${filePath}`);
        return { message: 'File deleted successfully' };
      }
      throw new NotFoundException('File not found');
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Local delete failed', error);
      throw new BadRequestException('File deletion failed');
    }
  }
}

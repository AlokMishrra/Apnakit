import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
  private supabase: SupabaseClient | null = null;
  private supabaseBucket: string;
  private supabaseInitialized = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.bucketName = this.configService.get('AWS_S3_BUCKET', 'nishumart-uploads');
    this.supabaseBucket = this.configService.get('SUPABASE_STORAGE_BUCKET', 'apnakit-uploads');
    this.useS3 = false;
  }

  private initSupabase(): SupabaseClient | null {
    if (this.supabaseInitialized) return this.supabase;
    this.supabaseInitialized = true;

    const supabaseUrl = this.configService.get('SUPABASE_URL');
    const supabaseKey =
      this.configService.get('SUPABASE_SERVICE_KEY') ||
      this.configService.get('SUPABASE_ANON_KEY');

    if (
      !supabaseUrl ||
      !supabaseKey ||
      supabaseUrl.startsWith('your-') ||
      supabaseKey.startsWith('your-')
    ) {
      this.logger.log('Supabase credentials not configured.');
      this.supabase = null;
      return null;
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log(`Supabase storage initialized (bucket: ${this.supabaseBucket})`);
      return this.supabase;
    } catch (err) {
      this.logger.warn('Failed to initialize Supabase client.', err as any);
      this.supabase = null;
      return null;
    }
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
      this.logger.log('AWS credentials not configured.');
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
      this.logger.warn('Failed to initialize AWS S3.');
      this.useS3 = false;
    }
  }

  /**
   * Shared upload logic — tries Supabase Storage first, then S3, then local disk.
   * This ensures uploaded files persist across Render redeploys.
   */
  private async uploadFile(file: Express.Multer.File, folder: string) {
    // 1) Supabase Storage (preferred — persistent, free tier available)
    const supabase = this.initSupabase();
    if (supabase) {
      try {
        return await this.uploadToSupabase(supabase, file, folder);
      } catch (err) {
        this.logger.error('Supabase upload failed, falling back to S3 or local', err as any);
      }
    }

    // 2) AWS S3
    await this.initS3();
    if (this.useS3 && this.s3) {
      try {
        return await this.uploadToS3(file, folder);
      } catch (err) {
        this.logger.error('S3 upload failed, falling back to local', err as any);
      }
    }

    // 3) Local disk (ephemeral on Render free tier — files are lost on redeploy)
    return this.uploadToLocal(file, folder);
  }

  private async uploadToSupabase(
    supabase: SupabaseClient,
    file: Express.Multer.File,
    folder: string,
  ) {
    const { error: bucketCheckError } = await supabase.storage.getBucket(this.supabaseBucket);
    if (bucketCheckError) {
      this.logger.log(`Bucket "${this.supabaseBucket}" not found, creating...`);
      const { error: createError } = await supabase.storage.createBucket(this.supabaseBucket, {
        public: true,
        fileSizeLimit: 200 * 1024 * 1024,
      });
      if (createError) {
        this.logger.warn(`Failed to create bucket: ${createError.message}`);
      } else {
        this.logger.log(`Bucket "${this.supabaseBucket}" created successfully`);
      }
    }

    const ext = path.extname(file.originalname) || this.getExtFromMime(file.mimetype);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '-');
    const fileName = `${Date.now()}-${baseName}${ext}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from(this.supabaseBucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '31536000',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from(this.supabaseBucket)
      .getPublicUrl(filePath);

    const url = publicUrlData.publicUrl;
    this.logger.log(`File uploaded to Supabase: ${filePath} -> ${url}`);

    return {
      url,
      key: filePath,
      size: file.size,
      mimetype: file.mimetype,
    };
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

    return this.uploadFile(file, folder);
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

    return this.uploadFile(file, folder);
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
    return this.uploadFile(file, folder);
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
    return this.uploadFile(file, folder);
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
    return this.uploadFile(file, folder);
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
        'https://apnakit-backend.onrender.com';
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

    // 1) Supabase Storage
    const supabase = this.initSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.storage.from(this.supabaseBucket).remove([key]);
        if (!error) {
          this.logger.log(`File deleted from Supabase: ${key}`);
          return { message: 'File deleted successfully' };
        }
        this.logger.warn(`Supabase delete returned error: ${error.message}`);
      } catch (err) {
        this.logger.error('Supabase delete failed', err as any);
      }
    }

    // 2) AWS S3
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

    // 3) Local delete
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

  async getStorageStatus() {
    const supabase = this.initSupabase();
    const supabaseReady = !!supabase;
    let supabaseBucketOk = false;
    if (supabase) {
      try {
        const { data, error } = await supabase.storage.getBucket(this.supabaseBucket);
        supabaseBucketOk = !error && !!data;
      } catch {}
    }
    await this.initS3();
    return {
      supabase: { configured: supabaseReady, bucket: this.supabaseBucket, bucketOk: supabaseBucketOk },
      s3: { configured: this.useS3, bucket: this.bucketName },
      activeProvider: supabaseReady && supabaseBucketOk ? 'supabase' : this.useS3 ? 's3' : 'local',
    };
  }
}

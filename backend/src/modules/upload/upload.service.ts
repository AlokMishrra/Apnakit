import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
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

export type UploadKind = 'image' | 'video' | 'app-icon' | 'apk' | 'ipa';

interface UploadKindSpec {
  folder: string;
  allowedMimes: string[];
  /** When set, a matching extension is accepted even if the MIME type is generic. */
  allowedExts?: string[];
  maxSizeBytes: number;
  label: string;
}

/**
 * Single source of truth for upload rules. Both the multipart endpoints and the
 * presign endpoint validate against this, so the two paths cannot drift apart.
 */
export const UPLOAD_KIND_SPECS: Record<UploadKind, UploadKindSpec> = {
  image: {
    folder: 'uploads',
    allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxSizeBytes: 5 * 1024 * 1024,
    label: 'image (JPEG, PNG, WebP, GIF)',
  },
  video: {
    folder: 'uploads',
    allowedMimes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    maxSizeBytes: 50 * 1024 * 1024,
    label: 'video (MP4, WebM, OGG, MOV)',
  },
  'app-icon': {
    folder: 'apps/icons',
    allowedMimes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
    maxSizeBytes: 2 * 1024 * 1024,
    label: 'icon (PNG, JPEG, WebP, SVG)',
  },
  apk: {
    folder: 'apps/android',
    allowedMimes: [
      'application/vnd.android.package-archive',
      'application/x-apk',
      'application/octet-stream',
    ],
    allowedExts: ['.apk', '.aab'],
    maxSizeBytes: 200 * 1024 * 1024,
    label: 'Android package (.apk, .aab)',
  },
  ipa: {
    folder: 'apps/ios',
    allowedMimes: [
      'application/octet-stream',
      'application/x-itunes-ipa',
      'application/x-apple-pkg',
    ],
    allowedExts: ['.ipa', '.pkg'],
    maxSizeBytes: 300 * 1024 * 1024,
    label: 'iOS package (.ipa, .pkg)',
  },
};

function resolveSpec(kind: UploadKind): UploadKindSpec {
  const spec = UPLOAD_KIND_SPECS[kind];
  if (!spec) {
    throw new BadRequestException(`Unknown upload kind "${kind}"`);
  }
  return spec;
}

/**
 * Validates name/type/size against the kind's spec. Shared by the multipart
 * endpoints and the presign endpoint.
 */
function assertValidUpload(
  kind: UploadKind,
  meta: { originalname: string; mimetype: string; size?: number },
): UploadKindSpec {
  const spec = resolveSpec(kind);
  const name = (meta.originalname || '').toLowerCase();

  if (spec.allowedExts?.length) {
    const extOk = spec.allowedExts.some((ext) => name.endsWith(ext));
    const mimeOk = spec.allowedMimes.includes(meta.mimetype);
    if (!extOk && !mimeOk) {
      throw new BadRequestException(`Invalid ${spec.label}`);
    }
  } else if (!spec.allowedMimes.includes(meta.mimetype)) {
    throw new BadRequestException(`Invalid ${spec.label}`);
  }

  if (meta.size != null && meta.size > spec.maxSizeBytes) {
    const limitMb = Math.round(spec.maxSizeBytes / (1024 * 1024));
    throw new BadRequestException(`File size exceeds ${limitMb}MB limit`);
  }

  return spec;
}

/** `<folder>/<timestamp>-<sanitised-basename><ext>` */
function buildStorageKey(folder: string, originalName: string, mimeType: string): string {
  const ext = path.extname(originalName) || extFromMime(mimeType);
  const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9-_]/g, '-');
  return `${folder}/${Date.now()}-${baseName}${ext}`;
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/ogg': '.ogv',
    'video/quicktime': '.mov',
    'image/svg+xml': '.svg',
  };
  return map[mime] || '.bin';
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private useS3: boolean;
  private s3: any = null;
  private bucketName: string;
  private awsRegion: string;
  private s3Initialized = false;
  private supabase: SupabaseClient | null = null;
  private supabaseBucket: string;
  private supabaseInitialized = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.bucketName = this.configService.get('AWS_S3_BUCKET', 'nishumart-uploads');
    this.awsRegion = this.configService.get('AWS_REGION', 'ap-south-1');
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
    const region = this.awsRegion;

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

    const filePath = buildStorageKey(folder, file.originalname, file.mimetype);

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

  /**
   * Returns a short-lived credential the browser can use to upload straight to
   * object storage.
   *
   * Vercel caps serverless request bodies at 4.5MB, so multi-hundred-megabyte
   * files (APK, IPA, video) can never be proxied through the API. Large uploads
   * must bypass it: the client asks for a ticket here, PUTs the bytes to the
   * storage provider, and only sends the resulting public URL to the API.
   */
  async createDirectUpload(params: {
    kind: UploadKind;
    fileName: string;
    contentType: string;
    size?: number;
  }) {
    const { kind, fileName, contentType, size } = params;

    const spec = assertValidUpload(kind, {
      originalname: fileName,
      mimetype: contentType,
      size,
    });

    const key = buildStorageKey(spec.folder, fileName, contentType);

    const supabase = this.initSupabase();
    if (supabase) {
      try {
        return await this.presignSupabase(supabase, kind, key);
      } catch (err) {
        this.logger.error('Supabase presign failed, falling back to S3', err as any);
      }
    }

    await this.initS3();
    if (this.useS3 && this.s3) {
      return this.presignS3(kind, key, contentType);
    }

    throw new ServiceUnavailableException(
      'Direct upload is unavailable because no object storage is configured. ' +
        'Set SUPABASE_URL and SUPABASE_SERVICE_KEY, or AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_S3_BUCKET.',
    );
  }

  private async presignSupabase(supabase: SupabaseClient, kind: UploadKind, key: string) {
    const { data, error } = await supabase.storage
      .from(this.supabaseBucket)
      .createSignedUploadUrl(key, { upsert: false });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from(this.supabaseBucket)
      .getPublicUrl(key);

    this.logger.log(`Presigned Supabase upload issued for ${key}`);

    return {
      provider: 'supabase',
      // The browser finishes this with supabase-js `uploadToSignedUrl`, which
      // needs the token plus a browser-side anon key.
      uploadUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      bucket: this.supabaseBucket,
      key,
      url: publicUrlData.publicUrl,
      maxSizeBytes: resolveSpec(kind).maxSizeBytes,
    };
  }

  private async presignS3(kind: UploadKind, key: string, contentType: string) {
    const uploadUrl = await this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
      Expires: 900,
    });

    const publicBase =
      this.configService.get('AWS_PUBLIC_BASE_URL') ||
      `https://${this.bucketName}.s3.${this.awsRegion}.amazonaws.com`;

    this.logger.log(`Presigned S3 upload issued for ${key}`);

    return {
      provider: 's3',
      uploadUrl,
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      bucket: this.bucketName,
      key,
      url: `${publicBase.replace(/\/$/, '')}/${key}`,
      maxSizeBytes: resolveSpec(kind).maxSizeBytes,
    };
  }

  async uploadImage(file: Express.Multer.File, folder = 'uploads') {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    assertValidUpload('image', file);

    return this.uploadFile(file, folder);
  }

  async uploadVideo(file: Express.Multer.File, folder = 'uploads') {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    assertValidUpload('video', file);

    return this.uploadFile(file, folder);
  }

  async uploadAppIcon(file: Express.Multer.File, folder = 'apps/icons') {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    assertValidUpload('app-icon', file);

    return this.uploadFile(file, folder);
  }

  async uploadApk(file: Express.Multer.File, folder = 'apps/android') {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    assertValidUpload('apk', file);

    return this.uploadFile(file, folder);
  }

  async uploadIpa(file: Express.Multer.File, folder = 'apps/ios') {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    assertValidUpload('ipa', file);

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
    const ext = path.extname(file.originalname) || extFromMime(file.mimetype);
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

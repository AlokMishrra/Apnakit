import { RequestMethod } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { join } from 'path';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { CustomValidationPipe } from './common/pipes/validation.pipe';

/**
 * Origins allowed to call the API with credentials.
 *
 * CORS_ORIGINS is a comma-separated allowlist and takes precedence. On top of
 * that, any *.vercel.app preview deployment is accepted so every branch preview
 * works without having to redeploy the backend with a new URL.
 */
export function resolveCorsOrigins(): string[] {
  const configured =
    process.env.CORS_ORIGINS ||
    process.env.PUBLIC_FRONTEND_URL ||
    'https://apnakit.in,https://www.apnakit.in';

  return configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isAllowedOrigin(origin: string): boolean {
  if (resolveCorsOrigins().includes(origin)) return true;
  // Vercel preview deployments, e.g. apnakit-abc123.vercel.app
  if (process.env.NODE_ENV === 'production' && /\.vercel\.app$/.test(origin)) return true;
  return false;
}

export async function configureApp(app: NestExpressApplication): Promise<void> {
  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(compression());

  // Allow large file uploads (APK up to 200MB, IPA up to 300MB)
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  app.enableCors({
    origin: (origin, callback) => {
      // Same-origin / server-to-server / curl requests have no Origin header.
      if (!origin) return callback(null, true);
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error(`CORS origin not allowed: ${origin}`), false);
    },
    credentials: true,
  });

  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 'truecaller/callback', method: RequestMethod.POST },
      { path: 'truecaller/callback', method: RequestMethod.GET },
      { path: '', method: RequestMethod.GET },
    ],
  });

  // Static files for uploaded images — explicitly set CORS headers so the
  // frontend (different port) can load them. On serverless this directory is
  // ephemeral, so uploads should target Supabase/S3 instead.
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalPipes(new CustomValidationPipe());

  // Swagger walks the whole module graph, which is slow on a serverless cold
  // start. Set SWAGGER_ENABLED=false to skip it.
  if (process.env.SWAGGER_ENABLED !== 'false') {
    const config = new DocumentBuilder()
      .setTitle('Ecommerce Platform API')
      .setDescription('The ecommerce platform REST API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('products', 'Product management')
      .addTag('orders', 'Order management')
      .addTag('payments', 'Payment processing')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }
}
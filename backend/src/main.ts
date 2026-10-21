import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  // Exit instead of staying alive: a process that is up but not serving
  // leaves the deploy waiting forever instead of failing fast.
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  await configureApp(app);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap().catch((error) => {
  console.error('Startup failed:', error);
  process.exit(1);
});

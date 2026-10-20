import http from 'node:http';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AppModule } from '../dist/app.module.js';
import { configureApp } from '../dist/bootstrap.js';

let cachedServer: http.Server | null = null;
let bootstrapPromise: Promise<http.Server> | null = null;

async function bootstrap(): Promise<http.Server> {
  const expressApp = express();
  const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  await configureApp(nestApp);
  await nestApp.init();
  console.log('Nest application initialised for serverless invocation');
  return http.createServer(expressApp);
}

async function getServer(): Promise<http.Server> {
  if (cachedServer) return cachedServer;
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }
  cachedServer = await bootstrapPromise;
  return cachedServer;
}

const handler = async (req: VercelRequest, res: VercelResponse): Promise<void> => {
  const server = await getServer();
  await new Promise<void>((resolve, reject) => {
    res.once('finish', () => resolve());
    res.once('close', () => resolve());
    server.emit('request', req, res);
  }).catch((error) => {
    console.error('Error while handling request', error);
    if (!res.headersSent) res.statusCode = 500;
    res.end(JSON.stringify({ statusCode: 500, message: 'Internal server error' }));
  });
};

export default handler;
export { handler };

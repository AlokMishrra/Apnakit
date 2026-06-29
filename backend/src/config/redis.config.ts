import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL', 'redis://localhost:6379');

        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const Redis = require('ioredis');
          const redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy(times: number) {
              const delay = Math.min(times * 50, 2000);
              return delay;
            },
            lazyConnect: true,
          });

          redis.on('connect', () => {
            console.log('Redis connected successfully');
          });

          redis.on('error', (error) => {
            console.error('Redis connection error:', error.message);
          });

          redis.on('ready', () => {
            console.log('Redis is ready');
          });

          redis.connect().catch((err) => {
            console.error('Failed to connect to Redis:', err.message);
          });

          return redis;
        } catch (err) {
          console.warn('Redis not available, running without cache');
          return null;
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}

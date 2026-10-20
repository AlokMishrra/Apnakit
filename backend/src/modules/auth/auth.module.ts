import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TruecallerCallbackController } from './truecaller-callback.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * Google sign-in is optional. Registering the strategy without credentials
 * makes passport throw during dependency injection, which would take down the
 * whole serverless container — so only register it when it is actually usable.
 */
const googleStrategyEnabled =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'super-secret-jwt-key'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRY', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
    NotificationsModule,
  ],
  controllers: [AuthController, TruecallerCallbackController],
  providers: [AuthService, JwtStrategy, ...(googleStrategyEnabled ? [GoogleStrategy] : [])],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}

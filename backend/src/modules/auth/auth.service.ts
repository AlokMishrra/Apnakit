import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../../config/database.config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendOtpDto } from './dto/otp-send.dto';
import { VerifyOtpDto } from './dto/otp-verify.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { SupabaseLoginDto } from './dto/supabase-login.dto';
import { Role } from '../../common/guards/roles.guard';
import { OtpType } from '@prisma/client';
import { Msg91Service } from '../notifications/msg91.service';
import { EmailService } from '../notifications/email.service';
import { FirebaseLoginDto } from './dto/firebase-login.dto';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private firebaseEnabled: boolean;
  private firebaseApp: App | null = null;
  private supabase: SupabaseClient;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private msg91Service: Msg91Service,
    private emailService: EmailService,
  ) {
    this.firebaseEnabled = this.initFirebase();
    this.initSupabase();
  }

  /**
   * Initialize Firebase Admin SDK for verifying ID tokens
   * Requires service account JSON from Firebase Console → Project Settings → Service Accounts
   */
  private initFirebase(): boolean {
    const projectId = this.configService.get('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get('FIREBASE_PRIVATE_KEY');
    if (
      !projectId ||
      !clientEmail ||
      !privateKey ||
      privateKey.includes('REPLACE_WITH') ||
      privateKey.includes('your-')
    ) {
      this.logger.log('Firebase Admin not configured (set FIREBASE_* env vars to enable)');
      return false;
    }
    try {
      const existing = getApps().find((a) => a?.name === 'nishumart-firebase');
      if (existing) {
        this.firebaseApp = existing;
      } else {
        this.firebaseApp = initializeApp(
          {
            credential: cert({
              projectId,
              clientEmail,
              privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
          },
          'nishumart-firebase'
        );
      }
      this.logger.log('Firebase Admin SDK ENABLED');
      return true;
    } catch (err: any) {
      this.logger.error(`Firebase init failed: ${err.message}`);
      return false;
    }
  }

  private initSupabase() {
    const url = this.configService.get('SUPABASE_URL');
    const key = this.configService.get('SUPABASE_SERVICE_KEY');
    if (url && key) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const ws = require('ws');
        this.supabase = createClient(url, key, {
          realtime: { transport: ws },
        });
      } catch {
        this.supabase = createClient(url, key, {
          realtime: { events: [] } as any,
        });
      }
      this.logger.log('Supabase client initialized for OTP');
    } else {
      this.logger.warn('Supabase not configured — OTP will use fallback');
    }
  }

  async register(dto: RegisterDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Either email or phone is required');
    }

    if (dto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email already registered');
      }
    }

    if (dto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already registered');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: Role.CUSTOMER,
        isVerified: false,
        isActive: true,
      },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const tempSession = await this.prisma.session.create({
      data: {
        userId: user.id,
        token: 'temp',
        refreshToken: 'temp',
        deviceInfo: null,
        ip: null,
        expiresAt,
      },
    });

    const tokens = await this.generateTokens(user.id, user.role, user.email, tempSession.id);

    await this.prisma.session.update({
      where: { id: tempSession.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });

    this.logger.log(`User registered: ${user.id}`);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto, deviceInfo?: any, ip?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated. Please contact support.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const tempSession = await this.prisma.session.create({
      data: {
        userId: user.id,
        token: 'temp',
        refreshToken: 'temp',
        deviceInfo: deviceInfo || null,
        ip: ip || null,
        expiresAt,
      },
    });

    const tokens = await this.generateTokens(user.id, user.role, user.email, tempSession.id);

    await this.prisma.session.update({
      where: { id: tempSession.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });

    this.logger.log(`User logged in: ${user.id}`);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async sendOtp(dto: SendOtpDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Either email or phone is required');
    }

    const intent = dto.intent || 'login';

    // Only check user existence for login/reset — register intentionally has no user yet
    if (intent !== 'register') {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            ...(dto.phone ? [{ phone: dto.phone }] : []),
            ...(dto.email ? [{ email: dto.email }] : []),
          ],
        },
      });
      if (!existingUser) {
        throw new BadRequestException('No account found with this email or phone. Please register first.');
      }
    }

    // Use Supabase OTP (Twilio) if available
    if (this.supabase) {
      try {
        if (dto.phone) {
          this.logger.log(`Sending Supabase OTP to phone ${dto.phone}`);
          const { error } = await this.supabase.auth.signInWithOtp({
            phone: dto.phone,
          });
          if (error) {
            this.logger.warn(`Supabase phone OTP failed: ${error.message}, falling back to local OTP`);
            // Fall through to local OTP generation below
          } else {
            return { message: `OTP sent successfully to ${dto.phone}`, expiresIn: 300 };
          }
        } else if (dto.email) {
          this.logger.log(`Sending Supabase OTP to email ${dto.email}`);
          const { error } = await this.supabase.auth.signInWithOtp({
            email: dto.email,
          });
          if (error) {
            this.logger.warn(`Supabase email OTP failed: ${error.message}, falling back to local OTP`);
          } else {
            return { message: `OTP sent successfully to ${dto.email}`, expiresIn: 300 };
          }
        }
      } catch (err: any) {
        this.logger.warn(`Supabase OTP error: ${err.message}, falling back to local OTP`);
      }
    }

    // Fallback: generate OTP and store in DB, send via MSG91/email
    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.oTP.deleteMany({
      where: {
        OR: [
          ...(dto.phone ? [{ phone: dto.phone }] : []),
          ...(dto.email ? [{ email: dto.email }] : []),
        ],
        type: OtpType.LOGIN,
      },
    });

    await this.prisma.oTP.create({
      data: {
        phone: dto.phone,
        email: dto.email,
        code,
        expiresAt,
        type: OtpType.LOGIN,
      },
    });

    if (dto.phone) {
      this.logger.log(`Sending OTP to phone ${dto.phone}: ${code}`);
      const result = await this.msg91Service.sendOtp(dto.phone, code);
      if (!result.success) {
        this.logger.warn(`MSG91 send failed: ${result.message}, falling back to mock`);
        await this.mockSendSms(dto.phone, code);
      }
    }

    if (dto.email) {
      this.logger.log(`Sending OTP to email ${dto.email}: ${code}`);
      const result = await this.emailService.sendOtp(dto.email, code);
      if (!result.success) {
        this.logger.warn(`Email send failed: ${result.message}, falling back to mock`);
        await this.mockSendEmail(dto.email, code);
      }
    }

    return {
      message: `OTP sent successfully to ${dto.phone || dto.email}`,
      expiresIn: 600,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Either email or phone is required');
    }

    let supabaseVerified = false;

    // Try Supabase OTP verification first
    if (this.supabase) {
      try {
        let result;
        if (dto.phone) {
          this.logger.log(`Verifying Supabase OTP for phone ${dto.phone}`);
          result = await this.supabase.auth.verifyOtp({
            phone: dto.phone,
            token: dto.code,
            type: 'sms',
          });
        } else if (dto.email) {
          this.logger.log(`Verifying Supabase OTP for email ${dto.email}`);
          result = await this.supabase.auth.verifyOtp({
            email: dto.email,
            token: dto.code,
            type: 'email',
          });
        }

        if (result?.error) {
          this.logger.warn(`Supabase OTP verify failed: ${result.error.message}, trying local DB`);
        } else {
          supabaseVerified = true;
          this.logger.log('Supabase OTP verified successfully');
        }
      } catch (err: any) {
        this.logger.warn(`Supabase verify error: ${err.message}, trying local DB`);
      }
    }

    // Fallback: verify against local OTP table (used when Supabase fails or is unavailable)
    if (!supabaseVerified) {
      const otp = await this.prisma.oTP.findFirst({
        where: {
          code: dto.code,
          OR: [
            ...(dto.phone ? [{ phone: dto.phone }] : []),
            ...(dto.email ? [{ email: dto.email }] : []),
          ],
          type: OtpType.LOGIN,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otp) {
        throw new BadRequestException('Invalid OTP code');
      }

      if (new Date() > otp.expiresAt) {
        await this.prisma.oTP.delete({ where: { id: otp.id } });
        throw new BadRequestException('OTP has expired');
      }

      await this.prisma.oTP.delete({ where: { id: otp.id } });
    }

    // Find existing user (login flow) or create new user (register flow)
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(dto.phone ? [{ phone: dto.phone }] : []),
          ...(dto.email ? [{ email: dto.email }] : []),
        ],
      },
    });

    if (!user) {
      // Register flow — create user without password (they'll set it next)
      const firstName = (dto as any).firstName || '';
      const lastName = (dto as any).lastName || '';
      user = await this.prisma.user.create({
        data: {
          phone: dto.phone || undefined,
          email: dto.email || undefined,
          firstName: firstName || 'User',
          lastName: lastName || '',
          isVerified: true,
          role: 'CUSTOMER',
          password: '',
        },
      });
      this.logger.log(`New user created via OTP: ${user.id}`);
    } else {
      // Login flow — mark as verified
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const tempSession = await this.prisma.session.create({
      data: {
        userId: user.id,
        token: 'temp',
        refreshToken: 'temp',
        deviceInfo: null,
        ip: null,
        expiresAt,
      },
    });

    const tokens = await this.generateTokens(user.id, user.role, user.email, tempSession.id);

    await this.prisma.session.update({
      where: { id: tempSession.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });

    this.logger.log(`OTP verified for user: ${user.id}`);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > session.expiresAt) {
      await this.prisma.session.delete({ where: { id: session.id } });
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (!session.user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const tokens = await this.generateTokens(
      session.user.id,
      session.user.role,
      session.user.email,
      session.id,
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
      },
    });

    return tokens;
  }

  async googleLogin(dto: GoogleLoginDto) {
    // 1) Verify the ID token against Google's public keys. This proves the
    //    caller really is the holder of the Google account tied to the
    //    provided email — the client cannot lie about email/name/avatar.
    const verified = await this.verifyGoogleIdToken(dto.idToken);
    if (!verified) {
      throw new UnauthorizedException(
        'Invalid or expired Google ID token. Please sign in with Google again.',
      );
    }
    if (!verified.email || !verified.emailVerified) {
      throw new UnauthorizedException(
        'Google account email is not verified. Please verify it in your Google account first.',
      );
    }
    if (verified.email !== dto.email) {
      throw new UnauthorizedException(
        'Google token email does not match the email sent by the client.',
      );
    }

    let user = await this.prisma.user.findUnique({
      where: { email: verified.email },
    });

    if (user) {
      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Use the Google picture (preferred) when present
      const newAvatar = verified.picture && (!user.avatar || user.avatar !== verified.picture)
        ? verified.picture
        : user.avatar || dto.avatar;
      if (newAvatar !== user.avatar) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { avatar: newAvatar },
        });
      }
    } else {
      user = await this.prisma.user.create({
        data: {
          email: verified.email,
          password: await bcrypt.hash(this.generateRandomPassword(), 12),
          firstName: verified.givenName || dto.firstName || 'User',
          lastName: verified.familyName || dto.lastName || '',
          avatar: verified.picture || dto.avatar,
          role: Role.CUSTOMER,
          isVerified: true,
          isActive: true,
        },
      });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const tempSession = await this.prisma.session.create({
      data: {
        userId: user.id,
        token: 'temp',
        refreshToken: 'temp',
        deviceInfo: { provider: 'google' },
        ip: null,
        expiresAt,
      },
    });

    const tokens = await this.generateTokens(user.id, user.role, user.email, tempSession.id);

    await this.prisma.session.update({
      where: { id: tempSession.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });

    this.logger.log(`Google login for user: ${user.id}`);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Start the Google OAuth 2.0 redirect flow. Returns the URL to send
   * the user to. This avoids the GIS "origin not allowed" issue because
   * the redirect flow is governed by Authorized redirect URIs, not
   * JavaScript origins.
   */
  buildGoogleRedirectUrl(state: string): string {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException(
        'GOOGLE_CLIENT_ID is not set on the server',
      );
    }
    const callbackUrl =
      this.configService.get<string>('GOOGLE_REDIRECT_CALLBACK_URL') ||
      `${this.configService.get<string>('PUBLIC_BACKEND_URL') || 'https://apnakit-backend.onrender.com'}/api/v1/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Complete the Google OAuth redirect flow. Exchanges the `code` for
   * tokens, fetches the user's profile, finds/creates the local user,
   * and issues our own JWTs. Returns a redirect URL that the controller
   * can send the browser to (with the ApnaKit access token in the
   * URL hash for the frontend callback to read).
   */
  async completeGoogleRedirect(code: string): Promise<{
    user: any;
    accessToken: string;
    refreshToken: string;
    frontendCallbackUrl: string;
  }> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    if (!clientId || !clientSecret || clientSecret.startsWith('your-')) {
      throw new BadRequestException(
        'Google OAuth client secret is not configured on the server. Add GOOGLE_CLIENT_SECRET to backend/.env',
      );
    }
    const callbackUrl =
      this.configService.get<string>('GOOGLE_REDIRECT_CALLBACK_URL') ||
      `${this.configService.get<string>('PUBLIC_BACKEND_URL') || 'https://apnakit-backend.onrender.com'}/api/v1/auth/google/callback`;

    // 1) Exchange the code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }).toString(),
    });
    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      this.logger.error(`Google token exchange failed: ${tokenRes.status} ${text}`);
      throw new UnauthorizedException(
        'Google rejected the authorization code. Please try again.',
      );
    }
    const tokenJson: any = await tokenRes.json();
    const googleAccessToken = tokenJson.access_token;
    const googleIdToken = tokenJson.id_token;
    if (!googleAccessToken || !googleIdToken) {
      throw new UnauthorizedException('Google returned an empty token response.');
    }

    // 2) Fetch the user's profile from Google's userinfo endpoint
    const profileRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    });
    if (!profileRes.ok) {
      throw new UnauthorizedException('Could not load your Google profile.');
    }
    const profile: any = await profileRes.json();
    if (!profile.email || !profile.email_verified) {
      throw new UnauthorizedException(
        'Your Google account email is not verified. Please verify it in your Google account.',
      );
    }

    // 3) Find-or-create the local user (same logic as the ID-token flow)
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });
    if (user) {
      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }
      if (!user.avatar && profile.picture) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { avatar: profile.picture },
        });
      }
    } else {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          password: await bcrypt.hash(this.generateRandomPassword(), 12),
          firstName: profile.given_name || 'User',
          lastName: profile.family_name || '',
          avatar: profile.picture,
          role: Role.CUSTOMER,
          isVerified: true,
          isActive: true,
        },
      });
    }

    // 4) Issue ApnaKit JWTs
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const tempSession = await this.prisma.session.create({
      data: {
        userId: user.id,
        token: 'temp',
        refreshToken: 'temp',
        deviceInfo: { provider: 'google-redirect' },
        ip: null,
        expiresAt,
      },
    });
    const tokens = await this.generateTokens(
      user.id,
      user.role,
      user.email,
      tempSession.id,
    );
    await this.prisma.session.update({
      where: { id: tempSession.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });

    this.logger.log(`Google OAuth redirect login for user: ${user.id}`);

    // 5) Hand the tokens back to the frontend via URL hash so the
    //    callback page can pick them up without exposing them in the URL
    //    path / server logs.
    const frontendBase =
      this.configService.get<string>('PUBLIC_FRONTEND_URL') ||
      'https://www.apnakit.in';
    const frontendCallback = new URL('/google-callback', frontendBase);
    frontendCallback.hash = `access_token=${encodeURIComponent(
      tokens.accessToken,
    )}&refresh_token=${encodeURIComponent(tokens.refreshToken)}`;

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      frontendCallbackUrl: frontendCallback.toString(),
    };
  }

  /**
   * Verify a Google ID token against Google's public keys. Returns the
   * decoded payload with email/name/picture if the token is valid.
   */
  private async verifyGoogleIdToken(idToken: string): Promise<{
    email: string;
    emailVerified: boolean;
    givenName: string;
    familyName: string;
    picture?: string;
  } | null> {
    try {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      if (!clientId) {
        this.logger.warn('GOOGLE_CLIENT_ID is not set — skipping ID-token verification');
        // Fallback: decode the JWT payload without verification.
        // NOTE: this is insecure and should only happen in dev. Set
        //       GOOGLE_CLIENT_ID in .env to enable proper verification.
        const payload = JSON.parse(
          Buffer.from(idToken.split('.')[1], 'base64').toString('utf8'),
        );
        return {
          email: payload.email,
          emailVerified: payload.email_verified,
          givenName: payload.given_name || '',
          familyName: payload.family_name || '',
          picture: payload.picture,
        };
      }
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      return {
        email: payload.email || '',
        emailVerified: !!payload.email_verified,
        givenName: payload.given_name || '',
        familyName: payload.family_name || '',
        picture: payload.picture as string | undefined,
      };
    } catch (err: any) {
      this.logger.warn(`Google ID token verification failed: ${err.message}`);
      return null;
    }
  }

  async logout(token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const session = await this.prisma.session.findFirst({
      where: { token },
    });

    if (session) {
      await this.prisma.session.delete({ where: { id: session.id } });
    }

    this.logger.log('User logged out');

    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async changePassword(userId: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
    this.logger.log(`Password changed for user: ${userId}`);
    return { message: 'Password updated successfully' };
  }

  /**
   * Exchange a Supabase auth session for ApnaKit JWTs.
   *
   * Flow:
   *  1. Verify the Supabase access token by calling the Supabase `/user` endpoint
   *  2. Find-or-create the local ApnaKit user keyed on Supabase user id
   *  3. Issue our own access + refresh tokens
   */
  async supabaseLogin(dto: SupabaseLoginDto) {
    if (!dto.supabaseAccessToken) {
      throw new BadRequestException('supabaseAccessToken is required');
    }

    // Verify the Supabase access token by calling Supabase's userinfo endpoint
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      throw new BadRequestException(
        'Supabase is not configured on the server. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in backend/.env',
      );
    }

    const userInfoUrl = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`;
    let sbUser: { id: string; email?: string; user_metadata?: any } | null = null;
    try {
      const resp = await fetch(userInfoUrl, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${dto.supabaseAccessToken}`,
        },
      });
      if (resp.ok) {
        sbUser = (await resp.json()) as any;
      }
    } catch (err: any) {
      this.logger.warn(`Supabase userinfo lookup failed: ${err.message}`);
    }

    if (!sbUser) {
      throw new UnauthorizedException(
        'Invalid or expired Supabase access token. Please sign in with Supabase again.',
      );
    }

    const email = (dto.email || sbUser.email || '').toLowerCase().trim();
    const phone = (dto.phone || (sbUser as any)?.phone || '').toString().trim();

    if (!email && !phone) {
      throw new BadRequestException(
        'Supabase user has neither email nor phone — please re-sign in with Google or use a phone number.',
      );
    }

    // Pull name / avatar from the user payload (prefer the values the
    // frontend sent, fall back to Supabase's user_metadata).
    const meta = (sbUser.user_metadata as any) || {};
    const fullName =
      dto.fullName ||
      meta.full_name ||
      meta.name ||
      (email ? email.split('@')[0] : phone.replace(/\D/g, '').slice(-6) || 'User');
    const avatar =
      dto.avatarUrl || meta.avatar_url || meta.picture || undefined;
    const nameParts = String(fullName).trim().split(/\s+/);
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ');

    // Find or create the local user. We match by email first; if there's
    // no email (phone-only user) we fall back to phone. This is the
    // simplest merge strategy that doesn't require a backfill script.
    let user = email
      ? await this.prisma.user.findUnique({ where: { email } })
      : null;
    if (!user && phone) {
      user = await this.prisma.user.findFirst({ where: { phone } });
    }
    if (user) {
      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }
      const update: any = {};
      if (!user.avatar && avatar) update.avatar = avatar;
      if (!user.phone && phone) update.phone = phone;
      if (Object.keys(update).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: update,
        });
      }
    } else {
      // For phone-only users, mint a placeholder email so the unique
      // constraint holds. They can later link a real email from /account.
      const placeholderEmail = email || `${phone.replace(/\D/g, '')}@phone.apnakit.in`;
      user = await this.prisma.user.create({
        data: {
          email: placeholderEmail,
          phone: phone || null,
          password: await bcrypt.hash(
            `supabase-${Date.now()}-${Math.random()}`,
            12,
          ),
          firstName,
          lastName,
          avatar,
          role: Role.CUSTOMER,
          isVerified: true,
          isActive: true,
        },
      });
      this.logger.log(`New user created via Supabase: ${user.id}`);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const tempSession = await this.prisma.session.create({
      data: {
        userId: user.id,
        token: 'temp',
        refreshToken: 'temp',
        deviceInfo: { provider: 'supabase-google' },
        ip: null,
        expiresAt,
      },
    });

    const tokens = await this.generateTokens(
      user.id,
      user.role,
      user.email,
      tempSession.id,
    );
    await this.prisma.session.update({
      where: { id: tempSession.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });

    this.logger.log(`Supabase Google login for user: ${user.id}`);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Verify a Firebase ID token (from Firebase Phone Auth or other Firebase auth methods)
   * If the user doesn't exist, creates them (Firebase login acts as social login).
   * Returns our own JWT tokens so the frontend can use them.
   */
  async verifyFirebaseToken(dto: FirebaseLoginDto) {
    if (!this.firebaseEnabled || !this.firebaseApp) {
      throw new BadRequestException(
        'Firebase is not configured on the server. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY to .env'
      );
    }
    if (!dto.idToken) {
      throw new BadRequestException('idToken is required');
    }

    let decoded: DecodedIdToken;
    try {
      decoded = await getAuth(this.firebaseApp).verifyIdToken(dto.idToken);
    } catch (err: any) {
      this.logger.warn(`Firebase ID token verification failed: ${err.message}`);
      throw new UnauthorizedException('Invalid or expired Firebase ID token');
    }

    const phone = (decoded.phone_number as string) || dto.phone || null;
    const email = (decoded.email as string) || dto.email || null;

    if (!phone && !email) {
      throw new BadRequestException('No phone or email in Firebase token or body');
    }

    // Find or create user
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(phone ? [{ phone }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (!user) {
      // New user — create from Firebase data
      const randomPassword = await bcrypt.hash(`firebase-${Date.now()}-${Math.random()}`, 12);
      user = await this.prisma.user.create({
        data: {
          phone,
          email,
          password: randomPassword,
          firstName: (decoded.name as string)?.split(' ')[0] || 'User',
          lastName: (decoded.name as string)?.split(' ').slice(1).join(' ') || '',
          avatar: (decoded.picture as string) || null,
          role: Role.CUSTOMER,
          isVerified: true,
          isActive: true,
        },
      });
      this.logger.log(`New user created via Firebase: ${user.id}`);
    } else if (!user.isVerified) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true, avatar: user.avatar || (decoded.picture as string) || null },
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated. Please contact support.');
    }

    // Create session and issue our own JWTs
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const tempSession = await this.prisma.session.create({
      data: {
        userId: user.id,
        token: 'firebase-temp',
        refreshToken: 'firebase-temp',
        deviceInfo: 'Firebase Auth',
        ip: null,
        expiresAt,
      },
    });

    const tokens = await this.generateTokens(user.id, user.role, user.email, tempSession.id);
    await this.prisma.session.update({
      where: { id: tempSession.id },
      data: { token: tokens.accessToken, refreshToken: tokens.refreshToken },
    });

    this.logger.log(`User logged in via Firebase: ${user.id}`);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async generateTokens(userId: string, role: string, email: string | null, sessionId?: string) {
    let sid = sessionId;
    if (!sid) {
      const existingSession = await this.prisma.session.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      sid = existingSession?.id;
    }

    const payload = {
      sub: userId,
      email,
      role,
      sessionId: sid || 'new',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'super-secret-refresh-key'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private sanitizeUser(user: any) {
    const { password, ...result } = user;
    return result;
  }

  private async mockSendSms(phone: string, code: string): Promise<void> {
    this.logger.log(`[MOCK SMS] To: ${phone}, Message: Your verification code is ${code}. It expires in 10 minutes.`);
  }

  private async mockSendEmail(email: string, code: string): Promise<void> {
    this.logger.log(`[MOCK EMAIL] To: ${email}, Subject: Your Verification Code, Body: Your code is ${code}. It expires in 10 minutes.`);
  }

  // ─── Truecaller SDK Integration ──────────────────────────────────────────

  // In-memory store for pending Truecaller verifications (requestId → status)
  private truecallerPending = new Map<string, {
    status: 'pending' | 'completed' | 'rejected' | 'expired';
    user?: any;
    tokens?: any;
    error?: string;
    createdAt: number;
  }>();

  private readonly TRUECALLER_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate a requestNonce for Truecaller deep link.
   * Frontend calls this to get a nonce, then triggers the deep link.
   */
  async generateTruecallerNonce(): Promise<{ requestId: string }> {
    const requestId = crypto.randomBytes(16).toString('base64url').slice(0, 64);
    this.truecallerPending.set(requestId, {
      status: 'pending',
      createdAt: Date.now(),
    });
    // Clean up expired entries
    for (const [key, val] of this.truecallerPending) {
      if (Date.now() - val.createdAt > this.TRUECALLER_TTL) {
        this.truecallerPending.delete(key);
      }
    }
    return { requestId };
  }

  /**
   * Callback endpoint — Truecaller POSTs here after user approves/denies.
   * Body: { requestId, accessToken, endpoint }
   */
  async handleTruecallerCallback(body: {
    requestId?: string;
    accessToken?: string;
    endpoint?: string;
    status?: string;
  }) {
    const { requestId, accessToken, endpoint, status } = body;
    this.logger.log(`Truecaller callback: requestId=${requestId}, status=${status || 'approved'}`);

    if (!requestId) {
      this.logger.error('Truecaller callback missing requestId');
      return;
    }

    // Truecaller sends "flow_invoked" first (no token yet) — just acknowledge
    if (status === 'flow_invoked') {
      this.logger.log(`Truecaller flow invoked for requestId=${requestId}`);
      return;
    }

    // User explicitly rejected
    if (status === 'user_rejected') {
      const pending = this.truecallerPending.get(requestId);
      if (pending) {
        pending.status = 'rejected';
        pending.error = 'User denied Truecaller verification';
      }
      return;
    }

    // No access token yet — ignore (intermediate callback)
    if (!accessToken) {
      this.logger.log(`Truecaller callback without accessToken (status=${status}), ignoring`);
      return;
    }

    try {
      // Fetch user profile from Truecaller
      const profileUrl = endpoint || 'https://profile4-noneu.truecaller.com/v1/default';
      const profileRes = await axios.get(profileUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Cache-Control': 'no-cache',
        },
        timeout: 10000,
      });

      const profile = profileRes.data;
      this.logger.log(`Truecaller profile received: ${JSON.stringify(profile).slice(0, 200)}`);

      const phone = String(profile.phoneNumbers?.[0] || '');
      const email = String(profile.onlineIdentities?.email || '');
      const firstName = profile.name?.first || '';
      const lastName = profile.name?.last || '';
      const avatar = profile.avatarUrl || '';

      if (!phone && !email) {
        this.logger.error('Truecaller profile has no phone or email');
        const pending = this.truecallerPending.get(requestId);
        if (pending) {
          pending.status = 'rejected';
          pending.error = 'No phone or email in Truecaller profile';
        }
        return;
      }

      // Find or create user
      let user = await this.prisma.user.findFirst({
        where: {
          OR: [
            ...(phone ? [{ phone }] : []),
            ...(email ? [{ email }] : []),
          ],
        },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            phone: phone || undefined,
            email: email || undefined,
            firstName: firstName || 'User',
            lastName: lastName || '',
            avatar: avatar || undefined,
            isVerified: true,
            role: 'CUSTOMER',
            password: '',
          },
        });
        this.logger.log(`New user created via Truecaller: ${user.id}`);
      } else {
        // Update user with Truecaller info
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            isVerified: true,
            ...(firstName && !user.firstName ? { firstName } : {}),
            ...(lastName && !user.lastName ? { lastName } : {}),
            ...(avatar && !user.avatar ? { avatar } : {}),
          },
        });
      }

      // Generate tokens
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const tempSession = await this.prisma.session.create({
        data: {
          userId: user.id,
          token: 'temp',
          refreshToken: 'temp',
          deviceInfo: { provider: 'truecaller' },
          ip: null,
          expiresAt,
        },
      });

      const tokens = await this.generateTokens(user.id, user.role, user.email, tempSession.id);

      await this.prisma.session.update({
        where: { id: tempSession.id },
        data: {
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      });

      // Store result
      const pending = this.truecallerPending.get(requestId);
      if (pending) {
        pending.status = 'completed';
        pending.user = this.sanitizeUser(user);
        pending.tokens = tokens;
      }

      this.logger.log(`Truecaller verification completed for user: ${user.id}`);
    } catch (err: any) {
      this.logger.error(`Truecaller callback error: ${err.message}`);
      const pending = this.truecallerPending.get(requestId);
      if (pending) {
        pending.status = 'rejected';
        pending.error = err.message;
      }
    }
  }

  /**
   * Frontend polls this to check if Truecaller verification is complete.
   */
  async getTruecallerStatus(requestId: string) {
    const pending = this.truecallerPending.get(requestId);
    if (!pending) {
      return { status: 'expired', error: 'Request not found or expired' };
    }
    return {
      status: pending.status,
      user: pending.user || null,
      tokens: pending.tokens || null,
      error: pending.error || null,
    };
  }
}

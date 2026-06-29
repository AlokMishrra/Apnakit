import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  Query,
  HttpCode,
  HttpStatus,
  Request,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendOtpDto } from './dto/otp-send.dto';
import { VerifyOtpDto } from './dto/otp-verify.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FirebaseLoginDto } from './dto/firebase-login.dto';
import { SupabaseLoginDto } from './dto/supabase-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/roles.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email or phone already registered' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Req() req: any) {
    return this.authService.login(dto, req.headers['user-agent'], req.ip);
  }

  @Public()
  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone or email' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and get tokens' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshTokens(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login or register with Google (ID token)' })
  @ApiResponse({ status: 200, description: 'Google authentication successful' })
  async googleLogin(@Body() dto: GoogleLoginDto) {
    return this.authService.googleLogin(dto);
  }

  @Public()
  @Get('google/redirect')
  @ApiOperation({
    summary: 'Start Google OAuth 2.0 redirect flow',
    description:
      'Returns a Google OAuth URL that the frontend can navigate the browser to. Use this instead of the GIS popup when the OAuth client does not allow JavaScript origins on your dev host.',
  })
  @ApiResponse({ status: 200, description: 'Google OAuth URL returned' })
  googleRedirectStart() {
    const url = this.authService.buildGoogleRedirectUrl('apnakit-oauth');
    return { url };
  }

  @Public()
  @Get('google/callback')
  @ApiOperation({
    summary: 'Google OAuth 2.0 callback (exchanges the auth code for tokens)',
  })
  @ApiResponse({ status: 302, description: 'Redirects to the frontend with tokens' })
  async googleRedirectCallback(
    @Query('code') code: string,
    @Res() res: any,
  ) {
    if (!code) {
      return res.redirect('/login?error=google_no_code');
    }
    try {
      const { frontendCallbackUrl } =
        await this.authService.completeGoogleRedirect(code);
      return res.redirect(frontendCallbackUrl);
    } catch (err: any) {
      this.logger.warn(
        `Google OAuth redirect failed: ${err?.message || err}`,
      );
      const msg = encodeURIComponent(err?.message || 'google_failed');
      return res.redirect(`/login?error=${msg}`);
    }
  }

  @Public()
  @Post('supabase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange a Supabase auth session for ApnaKit JWTs',
    description:
      'After the user signs in with Supabase (via the frontend `supabase.auth.signInWithIdToken` call), the resulting Supabase access token is sent here. We verify the token with Supabase, find-or-create the local user, and issue our own JWTs so the rest of the API works without changes.',
  })
  @ApiResponse({ status: 200, description: 'ApnaKit tokens issued' })
  @ApiResponse({ status: 401, description: 'Invalid or expired Supabase token' })
  async supabaseLogin(@Body() dto: SupabaseLoginDto) {
    return this.authService.supabaseLogin(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@CurrentUser('sessionId') sessionId: string) {
    return this.authService.logout(sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password (authenticated)' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto.newPassword);
  }

  @Public()
  @Post('firebase/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Firebase ID token and login/register user' })
  @ApiResponse({ status: 200, description: 'Firebase auth successful' })
  @ApiResponse({ status: 401, description: 'Invalid Firebase ID token' })
  async firebaseVerify(@Body() dto: FirebaseLoginDto) {
    return this.authService.verifyFirebaseToken(dto);
  }

  // ─── Truecaller SDK ────────────────────────────────────────────────────

  @Public()
  @Post('truecaller/nonce')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a Truecaller requestNonce' })
  async truecallerNonce() {
    return this.authService.generateTruecallerNonce();
  }

  @Public()
  @Post('truecaller/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Truecaller sends accessToken here after user approves' })
  async truecallerCallback(@Body() body: any) {
    return this.authService.handleTruecallerCallback(body);
  }

  @Public()
  @Get('truecaller/status/:requestId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Frontend polls this to check Truecaller verification status' })
  async truecallerStatus(@Req() req: any) {
    const requestId = req.params.requestId;
    return this.authService.getTruecallerStatus(requestId);
  }
}

import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller()
export class TruecallerCallbackController {
  constructor(private readonly authService: AuthService) {}

  @Post('truecaller/callback')
  @HttpCode(HttpStatus.OK)
  async callback(@Body() body: any) {
    return this.authService.handleTruecallerCallback(body);
  }

  @Get('truecaller/status/:requestId')
  async status(@Param('requestId') requestId: string) {
    return this.authService.getTruecallerStatus(requestId);
  }
}

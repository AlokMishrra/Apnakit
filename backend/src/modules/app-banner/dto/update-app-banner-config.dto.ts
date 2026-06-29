import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAppBannerConfigDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  rating?: string;

  @IsOptional()
  @IsString()
  downloadCount?: string;

  @IsOptional()
  @IsString()
  iconType?: string;

  @IsOptional()
  @IsString()
  iconImage?: string;

  @IsOptional()
  @IsString()
  iconBgColor?: string;

  @IsOptional()
  @IsString()
  iconFgColor?: string;

  @IsOptional()
  @IsString()
  buttonText?: string;

  @IsOptional()
  @IsString()
  buttonStyle?: string;

  @IsOptional()
  @IsString()
  buttonColor?: string;

  @IsOptional()
  @IsString()
  playStoreUrl?: string;

  @IsOptional()
  @IsString()
  appStoreUrl?: string;

  @IsOptional()
  @IsString()
  apkFileUrl?: string;

  @IsOptional()
  @IsString()
  apkFileName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  apkFileSize?: number;

  @IsOptional()
  @IsString()
  ipaFileUrl?: string;

  @IsOptional()
  @IsString()
  ipaFileName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ipaFileSize?: number;

  @IsOptional()
  @IsString()
  windowsAppUrl?: string;

  @IsOptional()
  @IsString()
  macAppUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  dismissDays?: number;

  @IsOptional()
  @IsBoolean()
  showDownloadSection?: boolean;

  @IsOptional()
  @IsBoolean()
  showGooglePlay?: boolean;

  @IsOptional()
  @IsBoolean()
  showAppStore?: boolean;
}

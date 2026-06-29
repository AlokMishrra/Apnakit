import apiClient from "@/lib/api-client";

function normalizeUrl(url: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\/localhost:\d+/.test(url)) {
    return url.replace(/^https?:\/\/localhost:\d+/, "");
  }
  return url;
}

function normalizeConfig(c: AppBannerConfig | null): AppBannerConfig | null {
  if (!c) return null;
  return {
    ...c,
    iconImage: normalizeUrl(c.iconImage),
    apkFileUrl: normalizeUrl(c.apkFileUrl),
    ipaFileUrl: normalizeUrl(c.ipaFileUrl),
    windowsAppUrl: normalizeUrl(c.windowsAppUrl),
    macAppUrl: normalizeUrl(c.macAppUrl),
    playStoreUrl: normalizeUrl(c.playStoreUrl),
    appStoreUrl: normalizeUrl(c.appStoreUrl),
  };
}

export interface AppBannerConfig {
  id: string;
  isActive: boolean;
  title: string;
  rating: string | null;
  downloadCount: string | null;
  iconType: "image" | "emoji";
  iconImage: string | null;
  iconBgColor: string;
  iconFgColor: string;
  buttonText: string;
  buttonStyle: "outline" | "solid" | "gradient";
  buttonColor: string;
  playStoreUrl: string | null;
  appStoreUrl: string | null;
  apkFileUrl: string | null;
  apkFileName: string | null;
  apkFileSize: number | null;
  ipaFileUrl: string | null;
  ipaFileName: string | null;
  ipaFileSize: number | null;
  windowsAppUrl: string | null;
  macAppUrl: string | null;
  dismissDays: number;
  showDownloadSection: boolean;
  showGooglePlay: boolean;
  showAppStore: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WrappedResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

interface ConfigPayload {
  config: AppBannerConfig | null;
}

function unwrap<T>(res: { data: WrappedResponse<T> }): T {
  if (!res?.data) throw new Error("Empty response from server");
  return res.data.data;
}

export const appBannerService = {
  async getPublic(): Promise<AppBannerConfig | null> {
    const res = await apiClient.get<WrappedResponse<ConfigPayload>>("/app-banner");
    const payload = unwrap(res);
    return normalizeConfig(payload?.config ?? null);
  },

  async getAdmin(): Promise<AppBannerConfig> {
    const res = await apiClient.get<WrappedResponse<ConfigPayload>>("/admin/app-banner");
    const payload = unwrap(res);
    if (!payload?.config) {
      throw new Error("App banner config missing");
    }
    return payload.config;
  },

  async update(
    payload: Partial<Omit<AppBannerConfig, "id" | "createdAt" | "updatedAt">>
  ): Promise<AppBannerConfig> {
    const res = await apiClient.put<WrappedResponse<ConfigPayload>>(
      "/admin/app-banner",
      payload
    );
    const body = unwrap(res);
    if (!body?.config) {
      throw new Error("Failed to update app banner config");
    }
    return body.config;
  },
};

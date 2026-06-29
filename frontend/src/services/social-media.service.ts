import apiClient from "@/lib/api-client";

export interface SocialMediaLinks {
  facebook: string | null;
  twitter: string | null;
  instagram: string | null;
  youtube: string | null;
  linkedin: string | null;
  pinterest: string | null;
  telegram: string | null;
  whatsapp: string | null;
}

export interface SocialMediaConfig extends SocialMediaLinks {
  id: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WrappedResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

function unwrap<T>(res: { data: WrappedResponse<T> }): T {
  if (!res?.data) throw new Error("Empty response from server");
  return res.data.data;
}

export const socialMediaService = {
  async getPublic(): Promise<SocialMediaLinks | null> {
    const res = await apiClient.get<WrappedResponse<{ links: SocialMediaLinks | null }>>("/social-media");
    const payload = unwrap(res);
    return payload?.links ?? null;
  },

  async getAdmin(): Promise<SocialMediaConfig> {
    const res = await apiClient.get<WrappedResponse<{ config: SocialMediaConfig }>>("/admin/social-media");
    const payload = unwrap(res);
    if (!payload?.config) throw new Error("Social media config missing");
    return payload.config;
  },

  async update(payload: Partial<Omit<SocialMediaConfig, "id" | "createdAt" | "updatedAt">>): Promise<SocialMediaConfig> {
    const res = await apiClient.put<WrappedResponse<{ config: SocialMediaConfig }>>("/admin/social-media", payload);
    const body = unwrap(res);
    if (!body?.config) throw new Error("Failed to update social media config");
    return body.config;
  },
};

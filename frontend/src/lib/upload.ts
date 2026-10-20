import api from "@/services/api";
import { getSupabase } from "./supabase-client";

export type UploadKind = "image" | "video" | "app-icon" | "apk" | "ipa";

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimetype: string;
}

interface PresignTicket {
  provider: "supabase" | "s3";
  uploadUrl: string;
  token?: string;
  path?: string;
  method?: string;
  headers?: Record<string, string>;
  bucket: string;
  key: string;
  url: string;
  maxSizeBytes?: number;
}

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogv",
  "video/quicktime": "mov",
};

function fallbackName(contentType: string): string {
  return `upload.${EXTENSION_BY_MIME[contentType] || "bin"}`;
}

/**
 * Uploads a file straight from the browser to object storage.
 *
 * The API is a serverless function with a 4.5MB request body cap, so anything
 * larger (video, APK, IPA) can never be proxied through it. Instead we ask the
 * API for a short-lived upload ticket, PUT the bytes to Supabase/S3 ourselves,
 * and return the resulting public URL in the same shape the old multipart
 * endpoints returned.
 */
export async function uploadFileToStorage(
  file: File,
  kind: UploadKind,
): Promise<UploadResult> {
  if (!file) {
    throw new Error("No file provided");
  }

  const contentType = file.type || "application/octet-stream";

  const response = await api.post("/upload/presign", {
    kind,
    fileName: file.name || fallbackName(contentType),
    contentType,
    size: file.size,
  });

  const ticket = response.data?.data as PresignTicket | undefined;
  if (!ticket?.uploadUrl) {
    throw new Error("Could not create an upload ticket");
  }

  if (ticket.provider === "supabase") {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error(
        "Supabase browser keys are not configured. Set NEXT_PUBLIC_SUPABASE_URL " +
          "and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
    }

    const { error } = await supabase.storage
      .from(ticket.bucket)
      .uploadToSignedUrl(ticket.path as string, ticket.token as string, file, {
        contentType,
        cacheControl: "31536000",
      });

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const result = await fetch(ticket.uploadUrl, {
      method: ticket.method || "PUT",
      headers: ticket.headers,
      body: file,
    });

    if (!result.ok) {
      throw new Error(`Storage rejected the upload (HTTP ${result.status})`);
    }
  }

  return {
    url: ticket.url,
    key: ticket.key,
    size: file.size,
    mimetype: contentType,
  };
}
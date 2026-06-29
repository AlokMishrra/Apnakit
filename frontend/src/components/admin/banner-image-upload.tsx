"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, Link as LinkIcon, Image as ImageIcon, X, Video } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminService } from "@/services/admin.service";
import { getSafeErrorMessage } from "@/lib/safe-error";
import { toast } from "sonner";

type MediaType = "IMAGE" | "VIDEO";

interface BannerMediaUploadProps {
  value: string;
  mediaType: MediaType;
  onChange: (url: string) => void;
  onMediaTypeChange: (type: MediaType) => void;
}

export function BannerImageUpload({
  value,
  mediaType,
  onChange,
  onMediaTypeChange,
}: BannerMediaUploadProps) {
  const [tab, setTab] = useState<"upload" | "url">(
    value && !value.startsWith("http://localhost") && !value.includes("/uploads/") ? "url" : "upload"
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mediaType === "IMAGE") {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
    } else {
      const allowed = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
      if (!allowed.includes(file.type)) {
        toast.error("Please select a video file (MP4, WebM, OGG, MOV)");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Video size must be less than 50MB");
        return;
      }
    }

    setUploading(true);
    try {
      const res =
        mediaType === "VIDEO"
          ? await adminService.uploadVideo(file)
          : await adminService.uploadImage(file);
      const data = res?.data || res;
      const url = data?.url || data?.data?.url;
      if (!url) {
        throw new Error("Upload succeeded but no URL returned");
      }
      onChange(url);
      toast.success(`${mediaType === "VIDEO" ? "Video" : "Image"} uploaded successfully`);
    } catch (err) {
      toast.error(`Failed to upload ${mediaType === "VIDEO" ? "video" : "image"}`, {
        description: getSafeErrorMessage(err),
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const acceptAttr =
    mediaType === "VIDEO"
      ? "video/mp4,video/webm,video/ogg,video/quicktime"
      : "image/jpeg,image/png,image/webp,image/gif";

  return (
    <div className="space-y-3">
      {/* Media type selector */}
      <div className="flex gap-2 rounded-lg border bg-gray-50 p-1">
        <button
          type="button"
          onClick={() => {
            onMediaTypeChange("IMAGE");
            onChange("");
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mediaType === "IMAGE"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          Image
        </button>
        <button
          type="button"
          onClick={() => {
            onMediaTypeChange("VIDEO");
            onChange("");
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mediaType === "VIDEO"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Video className="h-4 w-4" />
          Video
        </button>
      </div>

      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            tab === "upload"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Upload className="h-4 w-4" />
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setTab("url")}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            tab === "url"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <LinkIcon className="h-4 w-4" />
          {mediaType === "VIDEO" ? "Video URL" : "Image URL"}
        </button>
      </div>

      {tab === "upload" ? (
        <div>
          <div
            className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
              value ? "border-transparent" : "border-gray-300 hover:border-indigo-400"
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center py-4">
                <Loader2 className="mb-2 h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : value ? (
              <div className="relative w-full">
                <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100">
                  {mediaType === "VIDEO" ? (
                    <video
                      src={value}
                      muted
                      playsInline
                      controls
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={value}
                      alt="Banner preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/600x300?text=Invalid+Image";
                      }}
                    />
                  )}
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => onChange("")}
                >
                  <X className="mr-1 h-3 w-3" />
                  Remove
                </Button>
              </div>
            ) : (
              <>
                {mediaType === "VIDEO" ? (
                  <Video className="mb-2 h-8 w-8 text-gray-400" />
                ) : (
                  <Upload className="mb-2 h-8 w-8 text-gray-400" />
                )}
                <p className="mb-1 text-sm text-gray-600">
                  <span className="font-semibold text-indigo-600">Click to upload</span> or
                  drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  {mediaType === "VIDEO"
                    ? "MP4, WebM, OGG, MOV up to 50MB (1920×600 recommended)"
                    : "PNG, JPG, WebP, GIF up to 5MB (1920×600 recommended)"}
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptAttr}
              onChange={handleFileSelect}
              disabled={uploading}
              className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
          </div>
          {value && (
            <p className="mt-2 break-all rounded bg-gray-50 p-2 text-xs text-muted-foreground">
              <span className="font-medium">URL:</span> {value}
            </p>
          )}
        </div>
      ) : (
        <div>
          <Input
            placeholder={
              mediaType === "VIDEO"
                ? "https://example.com/banner.mp4"
                : "https://placehold.co/1920x600?text=Banner"
            }
            value={value}
            onChange={(e) => onChange(e.target.value)}
            icon={<LinkIcon className="h-4 w-4" />}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {mediaType === "VIDEO"
              ? "Paste a hosted video URL (mp4/webm/ogg/mov)"
              : "Paste any hosted image URL"}
          </p>
          {value && (
            <div className="mt-3 overflow-hidden rounded-lg border">
              <div className="relative aspect-video bg-gray-100">
                {mediaType === "VIDEO" ? (
                  <video
                    src={value}
                    muted
                    playsInline
                    controls
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={value}
                    alt="Banner preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/600x300?text=Invalid+Image+URL";
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Phone, Mail, Loader2, ArrowLeft, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OtpInput } from "./otp-input";
import { authService } from "@/services/auth.service";
import { detectIdentifierType, maskIdentifier, parseIdentifier } from "@/lib/identifier";
import { getSafeErrorMessage } from "@/lib/safe-error";
import { toast } from "sonner";

interface OtpSectionProps {
  identifier: string; // email or phone from previous step
  purpose: "login" | "register" | "reset"; // purpose of the OTP
  onVerified: (data: { user: any; tokens: any }) => void;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  initialName?: string; // for register flow
}

type Step = "send" | "verify";

export function OtpSection({
  identifier,
  purpose,
  onVerified,
  onBack,
  title,
  subtitle,
}: OtpSectionProps) {
  const [step, setStep] = useState<Step>("send");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiryRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sentRef = useRef(false);

  const type = detectIdentifierType(identifier);
  const parsed = parseIdentifier(identifier);
  const isPhone = type === "phone";
  const Icon = isPhone ? Phone : Mail;
  const masked = maskIdentifier(identifier);

  const purposeText = {
    login: "sign in to your account",
    register: "complete your registration",
    reset: "reset your password",
  }[purpose];

  const startCooldown = useCallback((seconds: number) => {
    setResendCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  const startExpiry = useCallback((seconds: number) => {
    setExpiresIn(seconds);
    if (expiryRef.current) clearInterval(expiryRef.current);
    expiryRef.current = setInterval(() => {
      setExpiresIn((s) => {
        if (s <= 1) {
          if (expiryRef.current) clearInterval(expiryRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      if (expiryRef.current) clearInterval(expiryRef.current);
    };
  }, []);

  const handleSendOtp = useCallback(async () => {
    if (type === "unknown") {
      toast.error("Please enter a valid email or phone number");
      return;
    }
    setError(null);
    setSending(true);
    try {
      const payload: any = {};
      if (parsed.email) payload.email = parsed.email;
      if (parsed.phone) payload.phone = parsed.phone;
      payload.intent = purpose;
      const res = await authService.sendOtp(payload);
      const data = res?.data || res;
      const exp = data?.expiresIn || 600;
      toast.success(`OTP sent to ${masked}`);
      setStep("verify");
      setOtp("");
      startCooldown(30);
      startExpiry(exp);
    } catch (err) {
      const msg = getSafeErrorMessage(err, "Failed to send OTP. Please try again.");
      setError(msg);
      toast.error("Failed to send OTP", { description: msg });
    } finally {
      setSending(false);
    }
  }, [parsed, type, masked, startCooldown, startExpiry]);

  // Auto-send on mount — guarded by sentRef to prevent StrictMode double-fire
  useEffect(() => {
    if (step === "send" && type !== "unknown" && !error && !sentRef.current) {
      sentRef.current = true;
      handleSendOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerifyOtp = useCallback(
    async (code: string) => {
      if (!code || code.length !== 6) return;
      setError(null);
      setVerifying(true);
      try {
        const payload: any = { code };
        if (parsed.email) payload.email = parsed.email;
        if (parsed.phone) payload.phone = parsed.phone;
        const res = await authService.verifyOtp(payload);
        const data = res?.data || res;
        const user = data?.user;
        const accessToken = data?.accessToken;
        const refreshToken = data?.refreshToken;
        if (accessToken) {
          toast.success(
            purpose === "register"
              ? "Phone/email verified! Complete your registration."
              : purpose === "reset"
              ? "Verified! Set a new password."
              : "Welcome back!"
          );
          onVerified({ user, tokens: { accessToken, refreshToken } });
        } else {
          throw new Error("No access token returned");
        }
      } catch (err) {
        const msg = getSafeErrorMessage(err, "Invalid or expired OTP. Please try again.");
        setError(msg);
        toast.error("Verification failed", { description: msg });
        setOtp("");
      } finally {
        setVerifying(false);
      }
    },
    [parsed, purpose, onVerified]
  );

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setOtp("");
    sentRef.current = false;
    await handleSendOtp();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (step === "send") {
    return (
      <div className="space-y-4 text-center">
        {onBack && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        )}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
          {sending ? (
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          ) : (
            <Icon className="h-6 w-6 text-indigo-600" />
          )}
        </div>
        <div>
          <h3 className="text-base font-semibold">{title || "Sending OTP..."}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {sending
              ? `Sending 6-digit code to ${masked}`
              : `We'll send a code to ${masked}`}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => { sentRef.current = false; handleSendOtp(); }}
          disabled={sending}
        >
          {sending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Resend OTP"
          )}
        </Button>
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 text-center">
      {onBack && (
        <div className="flex items-center">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Change {isPhone ? "phone" : "email"}
          </button>
        </div>
      )}
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
        <Icon className="h-6 w-6 text-indigo-600" />
      </div>
      <div>
        <h3 className="text-base font-semibold">
          {title || `Enter verification code`}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {subtitle || (
            <>
              We sent a 6-digit code to <span className="font-medium text-foreground">{masked}</span> to {purposeText}.
            </>
          )}
        </p>
      </div>

      <OtpInput
        value={otp}
        onChange={setOtp}
        onComplete={handleVerifyOtp}
        disabled={verifying}
      />

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {verifying && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-indigo-600">
          <Loader2 className="h-3 w-3 animate-spin" />
          Verifying...
        </p>
      )}

      <div className="space-y-2 text-xs text-muted-foreground">
        {expiresIn > 0 ? (
          <p>
            Code expires in <span className="font-medium text-foreground">{formatTime(expiresIn)}</span>
          </p>
        ) : (
          <p className="text-red-600">Code expired. Please resend.</p>
        )}

        <p>
          Didn&apos;t receive it?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || sending}
            className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${sending ? "animate-spin" : ""}`} />
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
          </button>
        </p>
      </div>
    </div>
  );
}

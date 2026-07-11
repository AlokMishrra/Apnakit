"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { setUser, setTokens } from "@/store/slices/authSlice";
import { setAuthCookies } from "@/lib/utils";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OtpInput } from "@/components/auth/otp-input";
import { Logo } from "@/components/brand/logo";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { TruecallerButton } from "@/components/auth/truecaller-button";
import { authService } from "@/services/auth.service";
import { getSafeErrorMessage } from "@/lib/safe-error";
import { toast } from "sonner";

type Step = "choose" | "email-login" | "otp";

function getRedirectPath(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "SELLER":
      return "/seller/dashboard";
    case "DELIVERY":
      return "/delivery/dashboard";
    default:
      return "/";
  }
}

function mapUser(user: any) {
  return {
    _id: user.id || user._id,
    name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    role: (user.role === "ADMIN" || user.role === "SELLER" || user.role === "DELIVERY" || user.role === "CUSTOMER")
      ? (user.role === "ADMIN" ? "admin" : user.role === "SELLER" ? "seller" : user.role === "DELIVERY" ? "delivery" : "user")
      : "user",
    isVerified: user.isVerified ?? true,
    addresses: [],
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: user.updatedAt || new Date().toISOString(),
  };
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const [step, setStep] = React.useState<Step>("choose");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [error, setError] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  React.useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      const decoded = decodeURIComponent(urlError);
      setError(decoded);
      toast.error("Google sign-in failed", { description: decoded });
      router.replace("/login", { scroll: false });
    }
  }, [searchParams, router]);

  const [otpCode, setOtpCode] = React.useState("");
  const [otpSentTo, setOtpSentTo] = React.useState("");
  const [verifyingOtp, setVerifyingOtp] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [expiresIn, setExpiresIn] = React.useState(0);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  React.useEffect(() => {
    if (expiresIn <= 0) return;
    const t = setTimeout(() => setExpiresIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [expiresIn]);

  const startCooldown = (seconds = 30) => setResendCooldown(seconds);
  const startExpiry = (seconds = 600) => setExpiresIn(seconds);

  const applyAuth = (user: any, accessToken: string, refreshToken: string) => {
    if (!accessToken) return;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    setAuthCookies(accessToken, refreshToken);
    if (user) {
      const mapped = mapUser(user);
      dispatch(setUser(mapped as any));
      dispatch(setTokens({ accessToken, refreshToken }));
      toast.success(`Welcome, ${mapped.name || "User"}!`);
      router.push(getRedirectPath(user.role));
    } else {
      router.push("/");
    }
  };

  // Email + Password login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await authService.login({ email, password });
      const data = res?.data || res;
      const accessToken = data?.accessToken || data?.tokens?.accessToken;
      const refreshToken = data?.refreshToken || data?.tokens?.refreshToken;
      if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        setAuthCookies(accessToken, refreshToken);
        if (data?.user) {
          dispatch(setUser(mapUser(data.user) as any));
          dispatch(setTokens({ accessToken, refreshToken }));
          toast.success(`Welcome back, ${mapUser(data.user).name || "User"}!`);
          router.push(getRedirectPath(data.user.role));
        } else {
          router.push("/");
        }
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      const msg = getSafeErrorMessage(err, "Login failed. Please check your credentials.");
      if (msg.toLowerCase().includes("no account found") || msg.toLowerCase().includes("register first")) {
        toast.info("Account not found", { description: "Redirecting to register page..." });
        router.push(`/register?identifier=${encodeURIComponent(email)}`);
        return;
      }
      setError(msg);
      toast.error("Login failed", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  // Send email OTP
  const sendEmailOtp = async () => {
    setSendingOtp(true);
    setError("");
    try {
      const res = await authService.sendOtp({ email, intent: "login" });
      const data = res?.data || res;
      if (data?.expiresIn) startExpiry(data.expiresIn);
      toast.success(`OTP sent to ${email}`);
      startCooldown(30);
    } catch (err: any) {
      const msg = getSafeErrorMessage(err, "Failed to send OTP");
      if (msg.toLowerCase().includes("no account found") || msg.toLowerCase().includes("register first")) {
        toast.info("Account not found", { description: "Redirecting to register page..." });
        router.push(`/register?identifier=${encodeURIComponent(email)}`);
        return;
      }
      setError(msg);
      toast.error("Failed to send OTP", { description: msg });
    } finally {
      setSendingOtp(false);
    }
  };

  React.useEffect(() => {
    if (step === "otp") sendEmailOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const verifyOtp = async (code: string): Promise<void> => {
    if (code.length !== 6) return;
    setVerifyingOtp(true);
    setError("");
    try {
      const res = await authService.verifyOtp({ code, email });
      const data = res?.data || res;
      const accessToken = data?.accessToken;
      const refreshToken = data?.refreshToken;
      const user = data?.user;
      if (!accessToken) throw new Error("No access token received");
      applyAuth(user, accessToken, refreshToken);
    } catch (err: any) {
      const msg = getSafeErrorMessage(err, "Invalid or expired OTP");
      if (msg.toLowerCase().includes("no account found") || msg.toLowerCase().includes("register first")) {
        toast.info("Account not found", { description: "Redirecting to register page..." });
        router.push(`/register?identifier=${encodeURIComponent(email)}`);
        return;
      }
      setError(msg);
      toast.error("Verification failed", { description: msg });
      setOtpCode("");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    await sendEmailOtp();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleTruecallerSuccess = async ({ user, tokens }: { user: any; tokens: any }) => {
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
    setAuthCookies(tokens.accessToken, tokens.refreshToken);
    dispatch(setUser(mapUser(user)));
    dispatch(setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }));
    toast.success(`Welcome, ${mapUser(user).name || "User"}!`);
    router.push(getRedirectPath(user.role));
  };

  return (
    <AuthLayout>
      <Card className="border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="mb-4 inline-block lg:hidden">
            <Logo className="h-8" />
          </div>
          <CardTitle className="text-2xl">
            {step === "otp" ? "Enter Verification Code" : "Welcome Back"}
          </CardTitle>
          <CardDescription>
            {step === "otp"
              ? `Code sent to ${otpSentTo}`
              : "Choose how to sign in"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Step 1: Choose method */}
          {step === "choose" && (
            <div className="space-y-3">
              <TruecallerButton
                onSuccess={handleTruecallerSuccess}
                onError={(err) => toast.error("Truecaller", { description: err })}
              />

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2"
                size="lg"
                onClick={() => { setStep("email-login"); setError(""); }}
              >
                <Mail className="h-4 w-4" />
                Continue with Email
              </Button>

              <GoogleSignInButton disabled={loading} />

              <p className="pt-2 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  Sign Up
                </Link>
              </p>
            </div>
          )}

          {/* Step 2: Email + Password (default login) */}
          {step === "email-login" && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                icon={<Mail className="h-4 w-4" />}
                required
                autoFocus
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  required
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? "🙈" : "👁"}
                    </button>
                  }
                />
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Sign In
              </Button>

              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Small OTP option */}
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have a password?{" "}
                <button
                  type="button"
                  onClick={() => {
                    if (!email.trim()) {
                      setError("Please enter your email first");
                      return;
                    }
                    setError("");
                    setOtpCode("");
                    setOtpSentTo(email);
                    setStep("otp");
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  Sign in with OTP
                </button>
              </p>

              <button
                type="button"
                onClick={() => { setStep("choose"); setError(""); setPassword(""); }}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </form>
          )}

          {/* Step 3: OTP verification */}
          {step === "otp" && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
                <Mail className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold">
                  {sendingOtp ? "Sending OTP..." : "Enter verification code"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {sendingOtp ? "Please wait..." : `We sent a 6-digit code to ${otpSentTo}`}
                </p>
              </div>

              {!sendingOtp && (
                <OtpInput
                  value={otpCode}
                  onChange={setOtpCode}
                  onComplete={verifyOtp}
                  disabled={verifyingOtp}
                />
              )}

              {error && <p className="text-xs text-red-600">{error}</p>}

              {verifyingOtp && (
                <p className="flex items-center justify-center gap-1.5 text-xs text-indigo-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Verifying...
                </p>
              )}

              {!sendingOtp && (
                <div className="space-y-2 text-xs text-muted-foreground">
                  {expiresIn > 0 && (
                    <p>
                      Code expires in{" "}
                      <span className="font-medium text-foreground">{formatTime(expiresIn)}</span>
                    </p>
                  )}
                  <p>
                    Didn&apos;t receive it?{" "}
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0 || sendingOtp}
                      className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : sendingOtp
                        ? "Sending..."
                        : "Resend code"}
                    </button>
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => { setStep("email-login"); setError(""); setOtpCode(""); setPassword(""); }}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

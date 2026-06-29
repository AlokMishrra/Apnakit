"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setUser, setTokens } from "@/store/slices/authSlice";
import { setAuthCookies } from "@/lib/utils";
import { Mail, Phone, ArrowLeft, Eye } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OtpSection } from "@/components/auth/otp-section";
import { authService } from "@/services/auth.service";
import { detectIdentifierType } from "@/lib/identifier";
import { getSafeErrorMessage } from "@/lib/safe-error";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";

type Step = "identifier" | "otp" | "password";

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

export default function ForgotPasswordPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [step, setStep] = React.useState<Step>("identifier");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [identifier, setIdentifier] = React.useState("");
  const [verifiedTokens, setVerifiedTokens] = React.useState<any>(null);
  const [verifiedUser, setVerifiedUser] = React.useState<any>(null);
  const [formData, setFormData] = React.useState({
    password: "",
    confirmPassword: "",
  });

  const identifierType = detectIdentifierType(identifier);
  const isValidIdentifier = identifierType !== "unknown";
  const IdentifierIcon = identifierType === "phone" ? Phone : Mail;

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidIdentifier) {
      setError("Please enter a valid email or phone number");
      return;
    }
    setError("");
    setStep("otp");
  };

  const handleOtpVerified = (data: { user: any; tokens: any }) => {
    setVerifiedTokens(data.tokens);
    setVerifiedUser(data.user);
    if (data.tokens?.accessToken) {
      // We have a valid session — let the user set a new password
      const { user, tokens } = data;
      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);
      setAuthCookies(tokens.accessToken, tokens.refreshToken);
      if (user) {
        dispatch(setUser(mapUser(user) as any));
        dispatch(setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }));
      }
      setStep("password");
    } else {
      setError("Verification succeeded but no session was created. Please try again.");
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!verifiedTokens?.accessToken) {
      setError("Session expired. Please verify your email/phone again.");
      setStep("identifier");
      return;
    }
    setLoading(true);
    try {
      const res = await authService.changePassword(formData.password);
      if (res?.success !== false) {
        toast.success("Password reset successful! Please login with your new password.");
        router.push("/login");
      } else {
        throw new Error(res?.message || "Failed to reset password");
      }
    } catch (err) {
      const msg = getSafeErrorMessage(err, "Failed to reset password.");
      setError(msg);
      toast.error("Password reset failed", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <AuthLayout>
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <div className="mb-4 inline-block lg:hidden">
              <Logo className="h-8" />
            </div>
            <CardTitle className="text-2xl">Verify Your Identity</CardTitle>
            <CardDescription>Confirm it&apos;s you to reset your password</CardDescription>
          </CardHeader>
          <CardContent>
            <OtpSection
              identifier={identifier}
              purpose="reset"
              onBack={() => setStep("identifier")}
              onVerified={handleOtpVerified}
            />
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  if (step === "password") {
    return (
      <AuthLayout>
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <div className="mb-4 inline-block lg:hidden">
              <Logo className="h-8" />
            </div>
            <CardTitle className="text-2xl">Set a New Password</CardTitle>
            <CardDescription>Choose a strong password for your account</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <form onSubmit={handleSetPassword} className="space-y-4">
              <Input
                label="New Password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  setError("");
                }}
                required
                autoFocus
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? "🙈" : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter the password"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  setError("");
                }}
                error={
                  formData.confirmPassword && formData.password !== formData.confirmPassword
                    ? "Passwords do not match"
                    : undefined
                }
                required
              />
              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={loading}
                disabled={!formData.password || formData.password !== formData.confirmPassword}
              >
                Reset Password
              </Button>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                Back to Login
              </button>
            </form>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="mb-4 inline-block lg:hidden">
            <Logo className="h-8" />
          </div>
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email or phone number and we&apos;ll send you a code to
            reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <form onSubmit={handleContinue} className="space-y-4">
            <div>
              <Input
                label="Email or Phone"
                type="text"
                placeholder="you@example.com or +91 98765 43210"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError("");
                }}
                icon={
                  isValidIdentifier ? (
                    <IdentifierIcon className="h-4 w-4 text-indigo-600" />
                  ) : undefined
                }
                required
              />
              {identifier && !isValidIdentifier && (
                <p className="mt-1 text-xs text-amber-600">
                  Enter a valid email or phone number
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={!isValidIdentifier}>
              Send Verification Code
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

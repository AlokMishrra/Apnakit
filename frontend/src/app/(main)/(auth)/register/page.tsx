"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { useDispatch } from "react-redux";
import { setUser, setTokens } from "@/store/slices/authSlice";
import { setAuthCookies } from "@/lib/utils";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OtpSection } from "@/components/auth/otp-section";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { TruecallerButton } from "@/components/auth/truecaller-button";
import { detectIdentifierType } from "@/lib/identifier";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";

type Step = "choose" | "email-input" | "otp" | "password";

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-orange-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-500" };
  if (score <= 4) return { score, label: "Strong", color: "bg-green-500" };
  return { score, label: "Very Strong", color: "bg-green-600" };
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

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillIdentifier = searchParams.get("identifier") || "";
  const dispatch = useDispatch();
  const [step, setStep] = React.useState<Step>("choose");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState(prefillIdentifier);
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [agreeToTerms, setAgreeToTerms] = React.useState(false);
  const [verifiedUser, setVerifiedUser] = React.useState<any>(null);
  const [verifiedTokens, setVerifiedTokens] = React.useState<any>(null);

  const passwordStrength = getPasswordStrength(password);

  const handleOtpVerified = (data: { user: any; tokens: any }) => {
    setVerifiedUser(data.user);
    setVerifiedTokens(data.tokens);
    if (data.tokens?.accessToken) {
      const { user, tokens } = data;
      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);
      setAuthCookies(tokens.accessToken, tokens.refreshToken);
      if (user) {
        dispatch(setUser(mapUser(user) as any));
        dispatch(setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }));
        if (!user.password) {
          setStep("password");
        } else {
          toast.success(`Welcome, ${mapUser(user).name || "User"}!`);
          router.push("/");
        }
      } else {
        setStep("password");
      }
    } else {
      setStep("password");
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      if (verifiedUser && verifiedTokens?.accessToken) {
        const { authService } = await import("@/services/auth.service");
        const res = await authService.changePassword(password);
        if (res?.success !== false) {
          toast.success("Password set! Welcome to ApnaKit.");
          router.push("/");
        } else {
          throw new Error(res?.message || "Failed to set password");
        }
      } else {
        const { authService } = await import("@/services/auth.service");
        const payload: any = { firstName, lastName, password, email };
        const res = await authService.register(payload);
        const data = res?.data || res;
        if (data?.accessToken) {
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          setAuthCookies(data.accessToken, data.refreshToken);
          if (data.user) {
            dispatch(setUser(mapUser(data.user) as any));
            dispatch(setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken }));
          }
          toast.success("Account created!");
          router.push("/");
        } else {
          throw new Error("No access token returned");
        }
      }
    } catch (err: any) {
      const { getSafeErrorMessage } = await import("@/lib/safe-error");
      const msg = getSafeErrorMessage(err, "Failed to complete registration.");
      setError(msg);
      toast.error("Registration failed", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!agreeToTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }
    setStep("otp");
  };

  const handleTruecallerSuccess = async ({ user, tokens }: { user: any; tokens: any }) => {
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
    setAuthCookies(tokens.accessToken, tokens.refreshToken);
    dispatch(setUser(mapUser(user)));
    dispatch(setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }));
    toast.success(`Welcome, ${mapUser(user).name || "User"}!`);
    router.push("/");
  };

  if (step === "otp") {
    return (
      <AuthLayout>
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <div className="mb-4 inline-block lg:hidden">
              <Logo className="h-8" />
            </div>
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            <CardDescription>One last step to create your account</CardDescription>
          </CardHeader>
          <CardContent>
            <OtpSection
              identifier={email}
              purpose="register"
              onBack={() => setStep("choose")}
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
            <CardTitle className="text-2xl">Set a Password</CardTitle>
            <CardDescription>Add a password to your account for future logins</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                required
                autoFocus
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground hover:text-foreground">
                    {showPassword ? "🙈" : "👁"}
                  </button>
                }
              />
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i < passwordStrength.score ? passwordStrength.color : "bg-muted"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{passwordStrength.label}</p>
                </div>
              )}
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                required
                rightIcon={
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-muted-foreground hover:text-foreground">
                    {showConfirmPassword ? "🙈" : "👁"}
                  </button>
                }
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Create Account
              </Button>
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
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Join ApnaKit and start shopping</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          {/* Step 1: Choose method */}
          {step === "choose" && (
            <div className="space-y-3">
              <TruecallerButton
                label="Sign up with Truecaller"
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
                onClick={() => { setStep("email-input"); setError(""); }}
              >
                <Mail className="h-4 w-4" />
                Sign up with Email
              </Button>

              <div className="mt-4">
                <GoogleSignInButton label="Sign up with Google" disabled={loading} />
              </div>

              <p className="pt-2 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Login
                </Link>
              </p>
            </div>
          )}

          {/* Step 2: Enter details + email */}
          {step === "email-input" && (
            <form onSubmit={handleSendEmailOtp} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); setError(""); }}
                  required
                />
                <Input
                  label="Last Name"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); setError(""); }}
                  required
                />
              </div>

              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                icon={<Mail className="h-4 w-4" />}
                required
              />

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </span>
              </label>

              <Button type="submit" className="w-full" size="lg" disabled={!firstName.trim() || !lastName.trim() || !email.trim() || !agreeToTerms}>
                Continue with Email OTP
              </Button>

              <button
                type="button"
                onClick={() => { setStep("choose"); setError(""); }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

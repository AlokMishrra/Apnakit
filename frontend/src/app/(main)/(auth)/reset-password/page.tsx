"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, CheckCircle, AlertTriangle } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import { api } from "@/services/api";
import { toast } from "sonner";

type Status = "form" | "success" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = React.useState<Status>(token ? "form" : "invalid");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("Invalid reset link");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: password });
      setStatus("success");
      toast.success("Password reset successful!");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to reset password";
      setError(msg);
      toast.error("Reset failed", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  if (status === "invalid") {
    return (
      <AuthLayout>
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <div className="mb-4 inline-block lg:hidden">
              <Logo className="h-8" />
            </div>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-7 w-7 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              href="/forgot-password"
              className="block w-full"
            >
              <Button className="w-full" size="lg">
                Request a New Link
              </Button>
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Login
            </Link>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  if (status === "success") {
    return (
      <AuthLayout>
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <div className="mb-4 inline-block lg:hidden">
              <Logo className="h-8" />
            </div>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Password Reset!</CardTitle>
            <CardDescription className="text-base">
              Your password has been updated successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              You can now log in with your new password.
            </p>
            <Link href="/login" className="block w-full">
              <Button className="w-full" size="lg">
                Go to Login
              </Button>
            </Link>
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
          <CardTitle className="text-2xl">Set New Password</CardTitle>
          <CardDescription>Choose a strong password for your account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New Password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
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
              label="Confirm Password"
              type="password"
              placeholder="Re-enter the password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              error={
                confirmPassword && password !== confirmPassword
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
              disabled={!password || password !== confirmPassword || password.length < 8}
            >
              Reset Password
            </Button>
            <Link
              href="/login"
              className="flex items-center justify-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Login
            </Link>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import { api } from "@/services/api";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to send reset link";
      setError(msg);
      toast.error("Error", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
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
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription className="text-base">
              We&apos;ve sent a password reset link to
            </CardDescription>
            <p className="mt-1 font-medium text-foreground">{email}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Click the link in the email to reset your password. The link expires in 1 hour.
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Didn&apos;t receive it? Check your spam folder or{" "}
              <button
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
                className="font-medium text-indigo-600 hover:underline"
              >
                try another email
              </button>
            </p>
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

  return (
    <AuthLayout>
      <Card className="border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="mb-4 inline-block lg:hidden">
            <Logo className="h-8" />
          </div>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
            <Mail className="h-7 w-7 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl">Forgot Password?</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you a link to reset your
            password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              icon={<Mail className="h-4 w-4 text-muted-foreground" />}
              required
              autoFocus
            />
            <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!email.includes("@")}>
              Send Reset Link
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

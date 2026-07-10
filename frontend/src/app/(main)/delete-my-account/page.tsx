"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Shield,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDispatch } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import { clearAuthCookies } from "@/lib/utils";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import api from "@/services/api";

export default function DeleteMyAccountPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isLoading: authLoading } = useCurrentUser();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [step, setStep] = useState<"warn" | "confirm">("warn");

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }
    setDeleting(true);
    try {
      await api.delete("/users/me");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      clearAuthCookies();
      dispatch(logout());
      toast.success("Your account has been deleted");
      router.push("/");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to delete account";
      toast.error(msg);
      setDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-lg font-semibold">Sign in required</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              You need to be signed in to delete your account.
            </p>
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <Link
        href="/account"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Account
      </Link>

      <Card className="border-red-200">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">Delete My Account</CardTitle>
          <CardDescription>
            This action is permanent and cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "warn" ? (
            <>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                <p className="mb-2 font-semibold">What happens when you delete your account:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Your profile, addresses, and saved information will be permanently removed</li>
                  <li>Your order history will be anonymized</li>
                  <li>Your wishlist and cart will be cleared</li>
                  <li>You will lose access to any active subscriptions or wallet balance</li>
                  <li>This action cannot be reversed</li>
                </ul>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" asChild>
                  <Link href="/account">Cancel</Link>
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setStep("confirm")}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  I understand, continue
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                To confirm, type <span className="font-mono font-bold text-foreground">DELETE</span> in the box below:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="font-mono"
                autoComplete="off"
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("warn");
                    setConfirmText("");
                  }}
                  disabled={deleting}
                >
                  Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting || confirmText !== "DELETE"}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting account...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Permanently delete my account
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

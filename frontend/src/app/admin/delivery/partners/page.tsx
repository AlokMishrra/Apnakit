"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Ban,
  CheckCircle,
  Key,
  Loader2,
  Truck,
  User,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let pass = "";
  for (let i = 0; i < 12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
  return pass;
}

export default function DeliveryPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; partner: any }>({ open: false, partner: null });
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; partner: any }>({ open: false, partner: null });
  const [passwordDialog, setPasswordDialog] = useState<{ open: boolean; partner: any; password: string }>({ open: false, partner: null, password: "" });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res = await adminService.getDeliveryPartners();
      const data = res?.data?.data || res?.data || [];
      setPartners(Array.isArray(data) ? data : data?.partners || []);
    } catch {
      toast.error("Failed to load delivery partners");
    } finally {
      setLoading(false);
    }
  };

  const filtered = partners.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${p.user?.firstName || ""} ${p.user?.lastName || ""}`.toLowerCase();
    return (
      name.includes(q) ||
      (p.user?.email || "").toLowerCase().includes(q) ||
      (p.user?.phone || "").includes(q) ||
      (p.vehicleNumber || "").toLowerCase().includes(q)
    );
  });

  const handleDelete = async () => {
    if (!deleteDialog.partner) return;
    setActionLoading(true);
    try {
      await adminService.deleteDeliveryPartner(deleteDialog.partner.id);
      toast.success("Delivery partner deleted");
      setDeleteDialog({ open: false, partner: null });
      fetchPartners();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete partner");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendDialog.partner) return;
    setActionLoading(true);
    try {
      const isCurrentlyActive = suspendDialog.partner.user?.isActive !== false;
      await adminService.suspendDeliveryPartner(suspendDialog.partner.id, isCurrentlyActive);
      toast.success(isCurrentlyActive ? "Partner suspended" : "Partner activated");
      setSuspendDialog({ open: false, partner: null });
      fetchPartners();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update partner");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!passwordDialog.partner || !passwordDialog.password) return;
    setActionLoading(true);
    try {
      await adminService.resetDeliveryPartnerPassword(passwordDialog.partner.id, passwordDialog.password);
      toast.success("Password updated successfully");
      setPasswordDialog({ open: false, partner: null, password: "" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reset password");
    } finally {
      setActionLoading(false);
    }
  };

  const openPasswordDialog = (partner: any) => {
    setPasswordDialog({ open: true, partner, password: generatePassword() });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/admin/dashboard" className="hover:text-foreground">Dashboard</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Delivery Partners</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Delivery Partners</h1>
          <p className="text-sm text-muted-foreground">Manage all delivery partners</p>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
          <Link href="/admin/delivery/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Delivery Person
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, vehicle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filtered.length} partner{filtered.length !== 1 ? "s" : ""}
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Truck className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No delivery partners found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Partner</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Contact</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Vehicle</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Joined</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((partner) => {
                  const isActive = partner.user?.isActive !== false;
                  const name = `${partner.user?.firstName || ""} ${partner.user?.lastName || ""}`.trim() || "Unknown";
                  return (
                    <tr key={partner.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{name}</p>
                            <p className="text-xs text-gray-500">{partner.user?.email || "No email"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-600">{partner.user?.phone || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-600">{partner.vehicleNumber || "—"}</p>
                        <p className="text-xs text-gray-500">{partner.vehicleType || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={isActive ? "success" : "destructive"}>
                          {isActive ? "Active" : "Suspended"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(partner.createdAt || partner.user?.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openPasswordDialog(partner)}>
                              <Key className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSuspendDialog({ open: true, partner })}>
                              {isActive ? (
                                <>
                                  <Ban className="mr-2 h-4 w-4" />
                                  Suspend
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteDialog({ open: true, partner })}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, partner: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Delivery Partner</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteDialog.partner?.user?.firstName} {deleteDialog.partner?.user?.lastName}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, partner: null })}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={suspendDialog.open} onOpenChange={(open) => setSuspendDialog({ open, partner: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {suspendDialog.partner?.user?.isActive !== false ? "Suspend" : "Activate"} Partner
            </DialogTitle>
            <DialogDescription>
              {suspendDialog.partner?.user?.isActive !== false
                ? `Suspend ${suspendDialog.partner?.user?.firstName}? They won't be able to accept deliveries.`
                : `Activate ${suspendDialog.partner?.user?.firstName}? They will be able to accept deliveries again.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog({ open: false, partner: null })}>Cancel</Button>
            <Button
              variant={suspendDialog.partner?.user?.isActive !== false ? "destructive" : "default"}
              onClick={handleSuspend}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {suspendDialog.partner?.user?.isActive !== false ? "Suspend" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordDialog.open} onOpenChange={(open) => setPasswordDialog({ open, partner: null, password: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{passwordDialog.partner?.user?.firstName} {passwordDialog.partner?.user?.lastName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">New Password</label>
            <div className="flex gap-2">
              <Input
                value={passwordDialog.password}
                onChange={(e) => setPasswordDialog((p) => ({ ...p, password: e.target.value }))}
                placeholder="Enter new password"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordDialog((p) => ({ ...p, password: generatePassword() }))}
              >
                <Key className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialog({ open: false, partner: null, password: "" })}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={actionLoading || passwordDialog.password.length < 6}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  MapPin,
  Loader2,
  Power,
  Pencil,
  Trash2,
  CheckCircle2,
  Truck,
  IndianRupee,
  AlertCircle,
  Check,
  X,
  PowerOff,
  Power as PowerOn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/safe-error";
import { cn } from "@/lib/utils";

interface DeliveryZone {
  id: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
  isActive: boolean;
  codEnabled: boolean;
  prepaidOnly: boolean;
  minOrderFreeDelivery: number | null;
  estimatedDays: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function DeliveryZonesPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [testPin, setTestPin] = useState("");
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testing, setTesting] = useState(false);
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState<
    null | { action: "activate" | "deactivate" | "delete" }
  >(null);

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getDeliveryZones({
        page: pagination.page,
        limit: 100,
        search: search.trim() || undefined,
        isActive: activeFilter === "" ? undefined : activeFilter === "true",
      });
      const data = res?.data || res;
      setZones(data?.items || []);
      setPagination(
        data?.pagination || { page: 1, limit: 50, total: 0, pages: 1 }
      );
      setSelectedIds(new Set()); // clear selection on refresh
    } catch (err) {
      toast.error("Failed to load delivery zones", {
        description: getSafeErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, activeFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchZones(), 250);
    return () => clearTimeout(t);
  }, [fetchZones]);

  const handleToggleActive = async (zone: DeliveryZone) => {
    try {
      await adminService.updateDeliveryZone(zone.id, { isActive: !zone.isActive });
      setZones((prev) =>
        prev.map((z) => (z.id === zone.id ? { ...z, isActive: !z.isActive } : z))
      );
      toast.success(zone.isActive ? "Zone deactivated" : "Zone activated");
    } catch (err) {
      toast.error("Failed to update zone", { description: getSafeErrorMessage(err) });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminService.deleteDeliveryZone(deleteId);
      setZones((prev) => prev.filter((z) => z.id !== deleteId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteId);
        return next;
      });
      toast.success("Delivery zone deleted");
      setDeleteId(null);
    } catch (err) {
      toast.error("Failed to delete zone", { description: getSafeErrorMessage(err) });
    }
  };

  const testPincode = async () => {
    if (testPin.length !== 6) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/delivery-zones/check/${testPin}`
      );
      const json = await res.json();
      setTestResult(json?.data || json);
    } catch {
      setTestResult({ serviceable: false, message: "Network error" });
    } finally {
      setTesting(false);
    }
  };

  // Bulk selection handlers
  const allSelected = useMemo(
    () => zones.length > 0 && selectedIds.size === zones.length,
    [zones, selectedIds]
  );
  const someSelected = useMemo(
    () => selectedIds.size > 0 && selectedIds.size < zones.length,
    [zones, selectedIds]
  );
  const selectedActiveCount = useMemo(
    () => zones.filter((z) => selectedIds.has(z.id) && z.isActive).length,
    [zones, selectedIds]
  );
  const selectedInactiveCount = useMemo(
    () => zones.filter((z) => selectedIds.has(z.id) && !z.isActive).length,
    [zones, selectedIds]
  );

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(zones.map((z) => z.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const performBulkAction = async (
    action: "activate" | "deactivate" | "delete"
  ) => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);
    try {
      const ids = Array.from(selectedIds);
      // Single API call — much faster than per-id sequential calls
      const res = await adminService.bulkDeliveryZones(action, ids);
      const updated = (res as any)?.data?.updated ?? 0;
      const deleted = (res as any)?.data?.deleted ?? 0;
      const count = updated || deleted || ids.length;
      toast.success(
        `${count} zone${count > 1 ? "s" : ""} ${
          action === "delete" ? "deleted" : action === "activate" ? "activated" : "deactivated"
        }`
      );
      setBulkConfirm(null);
      clearSelection();
      fetchZones();
    } catch (err) {
      toast.error(`Bulk ${action} failed`, { description: getSafeErrorMessage(err) });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const stats = {
    total: zones.length,
    active: zones.filter((z) => z.isActive).length,
    cod: zones.filter((z) => z.codEnabled).length,
    states: new Set(zones.map((z) => z.state)).size,
    cities: new Set(zones.map((z) => z.city)).size,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Delivery Zones</h1>
          <p className="text-muted-foreground">
            Manage pincodes and cities where ApnaKit delivers. Customers outside
            these zones will see &quot;Coming soon&quot;.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/delivery-zones/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Zone
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Zones</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">COD Enabled</p>
            <p className="text-2xl font-bold text-blue-600">{stats.cod}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Cities</p>
            <p className="text-2xl font-bold">{stats.cities}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">States</p>
            <p className="text-2xl font-bold">{stats.states}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pincode tester */}
      <Card className="border-indigo-100 bg-indigo-50/30">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-900">
                Test a pincode:
              </span>
            </div>
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={6}
              value={testPin}
              onChange={(e) =>
                setTestPin(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="110001"
              className="h-8 w-32 bg-white sm:w-40"
            />
            <Button
              size="sm"
              onClick={testPincode}
              disabled={testPin.length !== 6 || testing}
              className="gap-1"
            >
              {testing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Check
            </Button>
            {testResult && (
              <div
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs ${
                  testResult.serviceable
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {testResult.serviceable ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5" />
                )}
                {testResult.serviceable
                  ? `Serviceable: ${testResult.city}, ${testResult.state} • ${testResult.estimatedDays}d`
                  : `Not serviceable — ${testResult.message || "coming soon"}`}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by pincode, city, or state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
          <Button
            variant={activeFilter === "" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("")}
          >
            All
          </Button>
          <Button
            variant={activeFilter === "true" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("true")}
          >
            Active
          </Button>
          <Button
            variant={activeFilter === "false" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("false")}
          >
            Inactive
          </Button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 shadow-sm sm:gap-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Checkbox
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onCheckedChange={toggleSelectAll}
              aria-label="Select all"
            />
            <span className="text-sm font-medium text-indigo-900">
              {selectedIds.size} selected
            </span>
            {selectedActiveCount > 0 && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                {selectedActiveCount} active
              </Badge>
            )}
            {selectedInactiveCount > 0 && (
              <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                {selectedInactiveCount} inactive
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="text-indigo-700 hover:bg-indigo-100"
            >
              Clear
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkConfirm({ action: "activate" })}
              disabled={bulkActionLoading || selectedActiveCount === selectedIds.size}
              className="gap-1 bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <PowerOn className="h-3.5 w-3.5" />
              Activate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkConfirm({ action: "deactivate" })}
              disabled={bulkActionLoading || selectedInactiveCount === selectedIds.size}
              className="gap-1 bg-white text-amber-700 hover:bg-amber-50 hover:text-amber-700"
            >
              <PowerOff className="h-3.5 w-3.5" />
              Deactivate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkConfirm({ action: "delete" })}
              disabled={bulkActionLoading}
              className="gap-1 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : zones.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">No zones found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a pincode to start delivering to that area.
            </p>
            <Button asChild className="mt-4">
              <Link href="/admin/delivery-zones/new">
                <Plus className="mr-2 h-4 w-4" />
                Add First Zone
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="w-10 px-3 py-3">
                    <Checkbox
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all rows"
                    />
                  </th>
                  <th className="px-4 py-3">Pincode</th>
                  <th className="px-4 py-3">City / State</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">COD</th>
                  <th className="px-4 py-3">ETA</th>
                  <th className="px-4 py-3">Min Free</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => {
                  const isChecked = selectedIds.has(z.id);
                  return (
                    <tr
                      key={z.id}
                      className={cn(
                        "border-b last:border-b-0 transition-colors hover:bg-muted/20",
                        isChecked && "bg-indigo-50/50"
                      )}
                    >
                      <td className="px-3 py-3">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleSelectOne(z.id)}
                          aria-label={`Select ${z.pincode}`}
                        />
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold">
                        {z.pincode}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{z.city}</p>
                        <p className="text-xs text-muted-foreground">
                          {z.state} • {z.country}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={z.isActive ? "default" : "secondary"}
                          className={
                            z.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : ""
                          }
                        >
                          {z.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {z.prepaidOnly ? (
                          <Badge variant="secondary">Prepaid only</Badge>
                        ) : z.codEnabled ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                          {z.estimatedDays}d
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {z.minOrderFreeDelivery ? (
                          <div className="flex items-center gap-1">
                            <IndianRupee className="h-3 w-3 text-muted-foreground" />
                            {z.minOrderFreeDelivery}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActive(z)}
                            title={z.isActive ? "Deactivate" : "Activate"}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/admin/delivery-zones/${z.id}/edit`}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteId(z.id)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete single confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Delivery Zone</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this zone? Customers in this pincode
              will see &quot;Coming soon&quot;.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk action confirmation */}
      <Dialog
        open={!!bulkConfirm}
        onOpenChange={(o) => !o && !bulkActionLoading && setBulkConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkConfirm?.action === "delete"
                ? "Delete zones?"
                : bulkConfirm?.action === "activate"
                  ? "Activate zones?"
                  : "Deactivate zones?"}
            </DialogTitle>
            <DialogDescription>
              {bulkConfirm?.action === "delete" ? (
                <>
                  You are about to delete <b>{selectedIds.size}</b> zone
                  {selectedIds.size > 1 ? "s" : ""}. Customers in these pincodes
                  will see &quot;Coming soon&quot;. This action cannot be undone.
                </>
              ) : bulkConfirm?.action === "activate" ? (
                <>
                  Activate <b>{selectedIds.size}</b> zone
                  {selectedIds.size > 1 ? "s" : ""}? Customers in these pincodes
                  will be able to place orders.
                </>
              ) : (
                <>
                  Deactivate <b>{selectedIds.size}</b> zone
                  {selectedIds.size > 1 ? "s" : ""}? Customers in these pincodes
                  will see &quot;Coming soon&quot; (zones remain in DB).
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkConfirm(null)}
              disabled={bulkActionLoading}
            >
              Cancel
            </Button>
            <Button
              variant={
                bulkConfirm?.action === "delete" ? "destructive" : "default"
              }
              onClick={() => bulkConfirm && performBulkAction(bulkConfirm.action)}
              disabled={bulkActionLoading}
            >
              {bulkActionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {bulkConfirm?.action === "delete"
                ? `Delete ${selectedIds.size} zone${selectedIds.size > 1 ? "s" : ""}`
                : bulkConfirm?.action === "activate"
                  ? `Activate ${selectedIds.size}`
                  : `Deactivate ${selectedIds.size}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

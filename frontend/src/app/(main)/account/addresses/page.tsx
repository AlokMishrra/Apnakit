"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Home,
  Briefcase,
  Building2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { userService } from "@/services/user.service";
import { AddressForm, type AddressFormData } from "@/components/address/address-form";
import { getSafeErrorMessage, isAuthError } from "@/lib/safe-error";
import { toast } from "sonner";

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  HOME: { label: "Home", icon: Home, color: "bg-blue-100 text-blue-700" },
  WORK: { label: "Work", icon: Briefcase, color: "bg-indigo-100 text-indigo-700" },
  OTHER: { label: "Other", icon: Building2, color: "bg-gray-100 text-gray-700" },
};

function AddressSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddr, setEditingAddr] = useState<any | null>(null);
  const [formKey, setFormKey] = useState(0);

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await userService.getAddresses();
      const data = (res as any)?.data?.data || (res as any)?.data || res;
      const list = Array.isArray(data) ? data : [];
      setAddresses(list);
    } catch (err: any) {
      if (isAuthError(err)) {
        toast.error("Please login to view addresses");
        router.push("/login");
        return;
      }
      toast.error("Failed to load addresses", { description: getSafeErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const openAdd = () => {
    setEditingAddr(null);
    setFormKey((k) => k + 1);
    setShowForm(true);
  };

  const openEdit = (addr: any) => {
    setEditingAddr(addr);
    setFormKey((k) => k + 1);
    setShowForm(true);
  };

  const handleSubmit = async (data: AddressFormData) => {
    try {
      if (editingAddr) {
        const id = editingAddr.id || editingAddr._id;
        await userService.updateAddress(id, data);
        toast.success("Address updated!", { description: "Your address has been saved" });
      } else {
        await userService.createAddress({
          ...data,
          isDefault: addresses.length === 0 || data.isDefault,
        });
        toast.success("Address added!", { description: "New delivery address saved" });
      }
      setShowForm(false);
      setEditingAddr(null);
      fetchAddresses();
    } catch (err: any) {
      toast.error(
        editingAddr ? "Failed to update address" : "Failed to add address",
        { description: getSafeErrorMessage(err) }
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    try {
      await userService.deleteAddress(id);
      toast.success("Address deleted");
      fetchAddresses();
    } catch (err: any) {
      toast.error("Failed to delete address", { description: getSafeErrorMessage(err) });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const addr = addresses.find((a) => (a.id || a._id) === id);
      if (!addr) return;
      await userService.updateAddress(id, { ...addr, isDefault: true });
      toast.success("Default address updated");
      fetchAddresses();
    } catch (err: any) {
      toast.error("Failed to update default", { description: getSafeErrorMessage(err) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Saved Addresses</h1>
          <p className="text-sm text-muted-foreground">
            Manage your delivery addresses. Serviceability is verified per pincode.
          </p>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={() => (showForm ? setShowForm(false) : openAdd())}
        >
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? "Cancel" : "Add Address"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              {editingAddr ? "Edit Address" : "New Address"}
            </h3>
            <AddressForm
              key={formKey}
              initial={editingAddr || undefined}
              submitLabel={editingAddr ? "Update Address" : "Save Address"}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingAddr(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <AddressSkeleton key={i} />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <MapPin className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold text-foreground">No saved addresses</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add your first delivery address</p>
            <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={openAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((addr) => {
            const id = addr.id || addr._id;
            const type = (addr.type || "HOME").toUpperCase();
            const tc = typeConfig[type] || typeConfig.HOME;
            const TypeIcon = tc.icon;
            return (
              <Card key={id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge className={tc.color}>
                      <TypeIcon className="mr-1 h-3 w-3" />
                      {tc.label}
                    </Badge>
                    {addr.isDefault && (
                      <Badge className="bg-emerald-100 text-emerald-700">
                        <Star className="mr-1 h-3 w-3 fill-emerald-500" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">{addr.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {addr.addressLine1 || addr.street}
                  </p>
                  {addr.addressLine2 && (
                    <p className="text-sm text-muted-foreground">{addr.addressLine2}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">Phone: {addr.phone}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(addr)}>
                      <Edit2 className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    {!addr.isDefault && (
                      <Button variant="outline" size="sm" onClick={() => handleSetDefault(id)}>
                        <Star className="mr-1 h-3 w-3" />
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


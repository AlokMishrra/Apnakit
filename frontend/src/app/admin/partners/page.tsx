"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { partnerService, type AdminPartner } from "@/services/partner.service";

const emptyForm = {
  userId: "",
  code: "",
  customerDiscountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
  customerDiscountValue: "10",
  commissionRate: "5",
};

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<AdminPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPartners(await partnerService.adminList());
    } catch (err: any) {
      toast.error("Could not load partners", { description: err?.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!form.userId.trim()) return toast.error("Enter the user's ID, phone or email");
    setSaving(true);
    try {
      await partnerService.adminCreate({
        userId: form.userId.trim(),
        code: form.code.trim() || undefined,
        customerDiscountType: form.customerDiscountType,
        customerDiscountValue: Number(form.customerDiscountValue) || 0,
        commissionRate: Number(form.commissionRate) || 0,
      });
      toast.success("Partner created");
      setForm(emptyForm);
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message;
      toast.error("Could not create partner", { description: Array.isArray(msg) ? msg[0] : msg });
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (p: AdminPartner) => {
    try {
      await partnerService.adminUpdate(p.id, { isActive: !p.isActive });
      await load();
    } catch (err: any) {
      toast.error("Update failed", { description: err?.response?.data?.message || err.message });
    }
  };

  const payout = async (p: AdminPartner) => {
    try {
      const r = await partnerService.adminPayout(p.id);
      toast.success(`Paid ${r.paidCount} commission(s)`, { description: formatCurrency(r.paidAmount) });
      await load();
    } catch (err: any) {
      toast.error("Payout failed", { description: err?.response?.data?.message || err.message });
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-bold">Partners</h1>
        <p className="text-sm text-muted-foreground">
          Referral codes, customer discounts and partner commissions. Commission is earned on delivered orders.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-6">
          <Input label="User ID / phone / email" value={form.userId} onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))} />
          <Input label="Code (optional)" placeholder="APN-XXXX" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
          <div>
            <label className="mb-1.5 block text-sm font-medium">Customer discount</label>
            <select
              className="h-10 w-full rounded-md border px-2 text-sm"
              value={form.customerDiscountType}
              onChange={(e) => setForm((f) => ({ ...f, customerDiscountType: e.target.value as "PERCENTAGE" | "FIXED" }))}
            >
              <option value="PERCENTAGE">Percent %</option>
              <option value="FIXED">Fixed ₹</option>
            </select>
          </div>
          <Input label="Discount value" type="number" value={form.customerDiscountValue} onChange={(e) => setForm((f) => ({ ...f, customerDiscountValue: e.target.value }))} />
          <Input label="Commission %" type="number" value={form.commissionRate} onChange={(e) => setForm((f) => ({ ...f, commissionRate: e.target.value }))} />
          <div className="flex items-end">
            <Button className="w-full" onClick={create} disabled={saving}>
              {saving ? "Creating…" : "Create partner"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Code</th>
                <th className="px-4 py-2">Partner</th>
                <th className="px-4 py-2">Customer offer</th>
                <th className="px-4 py-2">Commission</th>
                <th className="px-4 py-2 text-right">Customers</th>
                <th className="px-4 py-2 text-right">Pending</th>
                <th className="px-4 py-2 text-right">Confirmed</th>
                <th className="px-4 py-2 text-right">Paid</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-muted-foreground">Loading…</td>
                </tr>
              )}
              {!loading && partners.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-muted-foreground">No partners yet.</td>
                </tr>
              )}
              {partners.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2 font-mono font-semibold">{p.code}</td>
                  <td className="px-4 py-2">
                    {p.user.firstName} {p.user.lastName}
                    <div className="text-xs text-muted-foreground">{p.user.phone || p.user.email}</div>
                  </td>
                  <td className="px-4 py-2">
                    {p.customerDiscountType === "PERCENTAGE" ? `${Number(p.customerDiscountValue)}%` : formatCurrency(Number(p.customerDiscountValue))} off
                  </td>
                  <td className="px-4 py-2">{Number(p.commissionRate)}%</td>
                  <td className="px-4 py-2 text-right">{p.customerCount}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(p.earnings.pending)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(p.earnings.confirmed)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(p.earnings.paid)}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggle(p)}>
                        {p.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button size="sm" onClick={() => payout(p)} disabled={p.earnings.confirmed <= 0}>
                        Pay out
                      </Button>
                    </div>
                    {!p.isActive && <Badge variant="destructive" className="mt-1">Inactive</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

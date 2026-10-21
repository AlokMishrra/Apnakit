"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Users, Wallet, Percent } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { partnerService, type MyPartner } from "@/services/partner.service";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  PAID: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
};

export default function PartnerPage() {
  const [data, setData] = useState<MyPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    partnerService
      .getMine()
      .then(setData)
      .catch((err: any) => {
        if (err?.response?.status === 401) {
          setError("Please log in to see your partner dashboard.");
        } else {
          setError("Could not load your partner details. Please try again.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Referral code copied");
    } catch {
      toast.error("Could not copy code");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto space-y-4 px-4 py-8">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto px-4 py-12 text-center text-sm text-muted-foreground">{error}</div>;
  }

  if (!data || !data.isPartner) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-xl font-semibold">Apnakit Partner</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You are not an Apnakit partner yet. Partners get a referral code to share; customers who use it get a discount,
          and you earn commission on their orders.
        </p>
        <Link href="/help" className="mt-4 inline-block text-sm font-medium text-primary underline">
          Contact us to become a partner
        </Link>
      </div>
    );
  }

  const discountLabel =
    data.customerDiscountType === "PERCENTAGE"
      ? `${data.customerDiscountValue}% off`
      : `${formatCurrency(data.customerDiscountValue)} off`;

  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      <div>
        <h1 className="text-xl font-bold">Partner dashboard</h1>
        <p className="text-sm text-muted-foreground">Share your code. Earn commission on every order your customers place.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Your referral code</p>
            <p className="text-2xl font-bold tracking-wider text-[#5b0a0a]">{data.code}</p>
            <p className="text-sm text-muted-foreground">
              Customers get {discountLabel} · You earn {data.commissionRate}% commission
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!data.isActive && <Badge variant="destructive">Inactive</Badge>}
            <Button variant="outline" onClick={() => copyCode(data.code)}>
              <Copy className="mr-2 h-4 w-4" /> Copy code
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<Users className="h-4 w-4" />} label="Customers" value={String(data.customerCount)} />
        <Stat icon={<Wallet className="h-4 w-4" />} label="Pending" value={formatCurrency(data.earnings.pending)} />
        <Stat icon={<Percent className="h-4 w-4" />} label="Confirmed" value={formatCurrency(data.earnings.confirmed)} />
        <Stat icon={<Wallet className="h-4 w-4" />} label="Paid out" value={formatCurrency(data.earnings.paid)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b px-4 py-3 font-semibold">Commissions</div>
          {data.commissions.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No commissions yet. Share your code to start earning.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Order</th>
                    <th className="px-4 py-2">Customer</th>
                    <th className="px-4 py-2 text-right">Order value</th>
                    <th className="px-4 py-2 text-right">Commission</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.commissions.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="px-4 py-2">{formatDate(c.createdAt)}</td>
                      <td className="px-4 py-2 font-mono text-xs">{c.orderNumber}</td>
                      <td className="px-4 py-2">{c.customerName}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(c.orderAmount)}</td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {formatCurrency(c.commissionAmount)}
                        <span className="ml-1 text-xs text-muted-foreground">({c.commissionRate}%)</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[c.status] ?? ""}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
          {icon} {label}
        </div>
        <p className="mt-1 text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

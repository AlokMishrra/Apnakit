"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { flashSaleService } from "@/services/flash-sale.service";
import { FlashSaleForm, FlashSaleFormData } from "@/components/admin/flash-sale-form";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/safe-error";

const toInputDateTime = (d: string | Date | null | undefined): string => {
  if (!d) return "";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "";
    // Convert to local datetime-local format
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  } catch {
    return "";
  }
};

export default function EditFlashSalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [initial, setInitial] = useState<Partial<FlashSaleFormData> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSale = async () => {
      try {
        const res = await flashSaleService.getById(id);
        const data = res?.data || res;
        const sale = data?.data || data;
        if (!sale) throw new Error("Flash sale not found");
        const productIds = (sale.products || [])
          .map((p: any) => p.id)
          .filter(Boolean);
        setInitial({
          productIds,
          variantIds: [],
          title: sale.title || "",
          salePrice: Number(sale.salePrice) || 0,
          originalPrice: Number(sale.originalPrice) || 0,
          totalStock: sale.totalStock || 0,
          startsAt: toInputDateTime(sale.startsAt),
          expiresAt: toInputDateTime(sale.expiresAt),
          isActive: sale.isActive ?? true,
        });
      } catch (err) {
        const msg = getSafeErrorMessage(err, "Failed to load flash sale");
        setError(msg);
        toast.error("Failed to load flash sale", { description: msg });
      } finally {
        setLoading(false);
      }
    };
    fetchSale();
  }, [id]);

  const handleSubmit = async (form: FlashSaleFormData) => {
    setSubmitting(true);
    try {
      const payload: any = {
        title: form.title || undefined,
        salePrice: form.salePrice,
        originalPrice: form.originalPrice,
        totalStock: form.totalStock,
        startsAt: new Date(form.startsAt).toISOString(),
        expiresAt: new Date(form.expiresAt).toISOString(),
        isActive: form.isActive,
      };
      await flashSaleService.update(id, payload);
      toast.success("Flash sale updated successfully");
      router.push("/admin/flash-sales");
    } catch (err) {
      toast.error("Failed to update flash sale", { description: getSafeErrorMessage(err) });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !initial) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-500" />
            <h2 className="mb-2 text-lg font-semibold">Flash Sale Not Found</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {error || "The flash sale you're trying to edit doesn't exist."}
            </p>
            <Button asChild>
              <Link href="/admin/flash-sales">Back to Flash Sales</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <FlashSaleForm
      initial={initial}
      onSubmit={handleSubmit}
      loading={submitting}
      submitLabel="Update Flash Sale"
      backHref="/admin/flash-sales"
      pageTitle="Edit Flash Sale"
      pageDescription="Update flash sale details"
    />
  );
}

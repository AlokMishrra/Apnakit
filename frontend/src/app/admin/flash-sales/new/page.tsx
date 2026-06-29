"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { flashSaleService } from "@/services/flash-sale.service";
import { FlashSaleForm, FlashSaleFormData } from "@/components/admin/flash-sale-form";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/safe-error";

export default function NewFlashSalePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (form: FlashSaleFormData) => {
    setLoading(true);
    try {
      const payload = {
        productId: form.productId,
        variantId: form.variantId || undefined,
        title: form.title || undefined,
        salePrice: form.salePrice,
        originalPrice: form.originalPrice,
        totalStock: form.totalStock,
        startsAt: new Date(form.startsAt).toISOString(),
        expiresAt: new Date(form.expiresAt).toISOString(),
        isActive: form.isActive,
      };
      const res = await flashSaleService.create(payload);
      const data = res?.data || res;
      const id = data?.id || data?._id;
      if (!id) throw new Error("Failed to create flash sale");
      toast.success("Flash sale created successfully");
      router.push("/admin/flash-sales");
    } catch (err) {
      toast.error("Failed to create flash sale", { description: getSafeErrorMessage(err) });
      setLoading(false);
    }
  };

  return (
    <FlashSaleForm
      onSubmit={handleSubmit}
      loading={loading}
      submitLabel="Create Flash Sale"
      backHref="/admin/flash-sales"
      pageTitle="Create Flash Sale"
      pageDescription="Set up a limited-time deal for the homepage"
    />
  );
}

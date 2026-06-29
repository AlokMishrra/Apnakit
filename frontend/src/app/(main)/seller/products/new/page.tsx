"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sellerService } from "@/services/seller.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Trash2,
  Upload,
  X,
  Save,
  Send,
} from "lucide-react";

const steps = ["Basic Info", "Variants", "Images", "Specifications", "Shipping", "SEO"];

interface Variant {
  name: string;
  price: string;
  stock: string;
  sku: string;
  attributes: { key: string; value: string }[];
}

interface Specification {
  key: string;
  value: string;
}

export default function AddProductPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    brand: "",
    description: "",
    shortDescription: "",
  });
  const [variants, setVariants] = useState<Variant[]>([
    { name: "Default", price: "", stock: "", sku: "", attributes: [] },
  ]);
  const [specifications, setSpecifications] = useState<Specification[]>([
    { key: "", value: "" },
  ]);
  const [shipping, setShipping] = useState({
    weight: "",
    length: "",
    width: "",
    height: "",
    shippingCost: "",
    freeShipping: false,
  });
  const [seo, setSeo] = useState({
    metaTitle: "",
    metaDescription: "",
  });
  const [images, setImages] = useState<{ file: File; preview: string; isPrimary: boolean }[]>([]);

  useEffect(() => {
    fetchCategoriesAndBrands();
  }, []);

  const fetchCategoriesAndBrands = async () => {
    try {
      const [catData, brandData] = await Promise.all([
        sellerService.getCategories(),
        sellerService.getBrands(),
      ]);
      setCategories(Array.isArray(catData) ? catData : []);
      setBrands(Array.isArray(brandData) ? brandData : []);
    } catch (error) {
      console.error("Failed to fetch categories/brands:", error);
      setCategories([]);
      setBrands([]);
    }
  };

  const handlePublish = async (asDraft: boolean = false) => {
    try {
      setSubmitting(true);
      const payload: any = {
        name: formData.name,
        description: formData.description,
        shortDescription: formData.shortDescription,
        categoryId: formData.category || undefined,
        brandId: formData.brand || undefined,
        price: variants.length > 0 && variants[0].price ? parseFloat(variants[0].price) : undefined,
        stock: variants.length > 0 && variants[0].stock ? parseInt(variants[0].stock) : undefined,
        variants: variants.map((v) => ({
          name: v.name || "Default",
          price: parseFloat(v.price) || 0,
          stock: parseInt(v.stock) || 0,
          sku: v.sku || `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        })),
        specifications: specifications
          .filter((s) => s.key && s.value)
          .map((s) => ({ name: s.key, value: s.value })),
        isActive: !asDraft,
      };
      const res = await sellerService.createProduct(payload);
      const productId = res?.data?.id || res?.id;
      if (productId && images.length > 0) {
        const formData = new FormData();
        images.forEach((img) => {
          formData.append('files', img.file);
        });
        await sellerService.uploadProductImages(productId, formData);
      }
      toast.success(asDraft ? "Product saved as draft" : "Product published successfully");
      router.push("/seller/products");
    } catch (error) {
      console.error("Failed to create product:", error);
      toast.error("Failed to create product. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isPrimary: images.length === 0,
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const removed = prev[index];
      if (removed.preview.startsWith("blob:")) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      { name: "", price: "", stock: "", sku: "", attributes: [] },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { key: "", value: "" }]);
  };

  const removeSpecification = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  const updateSpecification = (index: number, field: keyof Specification, value: string) => {
    const updated = [...specifications];
    updated[index] = { ...updated[index], [field]: value };
    setSpecifications(updated);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Add New Product</h1>
          <p className="text-muted-foreground">Fill in the details to list a new product</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white border rounded-lg p-4">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index < currentStep
                    ? "bg-primary text-primary-foreground"
                    : index === currentStep
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/20 ring-offset-2"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span className="text-xs mt-1 hidden sm:block">{step}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-1 w-8 sm:w-16 mx-2 ${
                  index < currentStep ? "bg-primary" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStep === 0 && (
            <>
              <Input
                label="Product Name"
                placeholder="Enter product name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger label="Category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id} label={cat.name} />
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  label="Brand"
                  placeholder="Enter brand name"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>
              <Textarea
                label="Short Description"
                placeholder="Brief description (displayed in listings)"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              />
              <Textarea
                label="Full Description"
                placeholder="Detailed product description"
                className="min-h-[150px]"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              {variants.map((variant, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Variant {index + 1}</h4>
                    {variants.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeVariant(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Input
                      label="Variant Name"
                      placeholder="e.g., Size, Color"
                      value={variant.name}
                      onChange={(e) => updateVariant(index, "name", e.target.value)}
                    />
                    <Input
                      label="Price (₹)"
                      placeholder="0.00"
                      type="number"
                      value={variant.price}
                      onChange={(e) => updateVariant(index, "price", e.target.value)}
                    />
                    <Input
                      label="Stock"
                      placeholder="0"
                      type="number"
                      value={variant.stock}
                      onChange={(e) => updateVariant(index, "stock", e.target.value)}
                    />
                    <Input
                      label="SKU"
                      placeholder="SKU-001"
                      value={variant.sku}
                      onChange={(e) => updateVariant(index, "sku", e.target.value)}
                    />
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addVariant}>
                <Plus className="h-4 w-4 mr-2" />
                Add Variant
              </Button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleImageUpload}
                />
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium">Drag & drop images here</p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse (PNG, JPG up to 5MB each)
                </p>
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.preview}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      {img.isPrimary && (
                        <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                First image will be the cover image. You can upload up to 10 images.
              </p>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              {specifications.map((spec, index) => (
                <div key={index} className="flex items-end gap-2">
                  <Input
                    label={index === 0 ? "Key" : undefined}
                    placeholder="e.g., Material"
                    value={spec.key}
                    onChange={(e) => updateSpecification(index, "key", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    label={index === 0 ? "Value" : undefined}
                    placeholder="e.g., Cotton"
                    value={spec.value}
                    onChange={(e) => updateSpecification(index, "value", e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-destructive shrink-0"
                    onClick={() => removeSpecification(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addSpecification}>
                <Plus className="h-4 w-4 mr-2" />
                Add Specification
              </Button>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Weight (kg)"
                  placeholder="0.5"
                  type="number"
                  value={shipping.weight}
                  onChange={(e) => setShipping({ ...shipping, weight: e.target.value })}
                />
                <Input
                  label="Shipping Cost (₹)"
                  placeholder="0 for free shipping"
                  type="number"
                  value={shipping.shippingCost}
                  onChange={(e) => setShipping({ ...shipping, shippingCost: e.target.value })}
                />
              </div>
              <p className="text-sm font-medium">Dimensions (cm)</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Length"
                  placeholder="0"
                  type="number"
                  value={shipping.length}
                  onChange={(e) => setShipping({ ...shipping, length: e.target.value })}
                />
                <Input
                  label="Width"
                  placeholder="0"
                  type="number"
                  value={shipping.width}
                  onChange={(e) => setShipping({ ...shipping, width: e.target.value })}
                />
                <Input
                  label="Height"
                  placeholder="0"
                  type="number"
                  value={shipping.height}
                  onChange={(e) => setShipping({ ...shipping, height: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shipping.freeShipping}
                  onChange={(e) =>
                    setShipping({ ...shipping, freeShipping: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Offer free shipping</span>
              </label>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <Input
                label="Meta Title"
                placeholder="SEO title (60 characters max)"
                value={seo.metaTitle}
                onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
              />
              <Textarea
                label="Meta Description"
                placeholder="SEO description (160 characters max)"
                value={seo.metaDescription}
                onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
              />
              <Input
                label="URL Slug"
                placeholder="product-url-slug"
                value={seo.slug}
                onChange={(e) => setSeo({ ...seo, slug: e.target.value })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((s) => s - 1)}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button onClick={() => setCurrentStep((s) => s + 1)}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline">Save as Draft</Button>
            <Button>Publish Product</Button>
          </div>
        )}
      </div>
    </div>
  );
}

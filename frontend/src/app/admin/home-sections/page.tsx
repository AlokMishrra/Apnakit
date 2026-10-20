"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  PackageX,
  LayoutGrid,
  Save,
  Eye,
  EyeOff,
  GripVertical,
  Tags,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import { getSafeErrorMessage } from "@/lib/safe-error";
import { toast } from "sonner";
import { adminService } from "@/services/admin.service";
import {
  homeSectionService,
  type AdminSection,
  type AdminSectionItem,
  type HomeSectionKey,
  type HomeSectionCategory,
} from "@/services/home-section.service";

const TABS: { key: HomeSectionKey; label: string; hint: string }[] = [
  {
    key: "QUICK",
    label: "Quick",
    hint: "A short curated rail at the top of the home page.",
  },
  {
    key: "SHOP_ALL",
    label: "Shop All",
    hint: "The wider grid shown when Shop All is selected.",
  },
];

interface Candidate {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  brand: string | null;
}

export default function AdminHomeSectionsPage() {
  const [activeTab, setActiveTab] = useState<HomeSectionKey>("QUICK");
  const [section, setSection] = useState<AdminSection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Editable copy
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [isSectionActive, setIsSectionActive] = useState(true);

  // Local working copy of the ordered item list; committed on Save.
  const [draft, setDraft] = useState<AdminSectionItem[]>([]);
  const [draftCategories, setDraftCategories] = useState<HomeSectionCategory[]>([]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Category picker
  const [catPickerOpen, setCatPickerOpen] = useState(false);
  const [catQuery, setCatQuery] = useState("");
  const [allCategories, setAllCategories] = useState<
    { id: string; name: string; slug: string; image: string | null }[]
  >([]);
  const [isLoadingCats, setIsLoadingCats] = useState(false);
  const [pendingCatId, setPendingCatId] = useState<string | null>(null);

  const loadSection = useCallback(async (key: HomeSectionKey) => {
    setIsLoading(true);
    setIsDirty(false);
    try {
      const data = await homeSectionService.getAdminSection(key);
      setSection(data);
      setTitle(data.title);
      setSubtitle(data.subtitle ?? "");
      setIsSectionActive(data.isActive);
      setDraft(data.items);
      setDraftCategories(data.categories);
    } catch (err) {
      toast.error("Could not load section", {
        description: getSafeErrorMessage(err),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSection(activeTab);
  }, [activeTab, loadSection]);

  const loadCandidates = useCallback(async (search: string) => {
    setIsSearching(true);
    try {
      const response = await adminService.getAllProducts({
        limit: 50,
        ...(search ? { search } : {}),
      });
      const products = (response?.data ?? []) as any[];
      setCandidates(
        products.map((p) => ({
          id: p.id || p._id,
          name: p.name,
          slug: p.slug,
          image: p.images?.[0]?.url ?? "",
          price: Number(p.price ?? p.variants?.[0]?.price ?? 0),
          brand: p.brand?.name ?? null,
        })),
      );
    } catch (err) {
      toast.error("Could not load products", {
        description: getSafeErrorMessage(err),
      });
    } finally {
      setIsSearching(false);
    }
  }, []);

  const inSection = useMemo(
    () => new Set(draft.map((i) => i.productId)),
    [draft],
  );

  const availableCandidates = useMemo(
    () => candidates.filter((c) => !inSection.has(c.id)),
    [candidates, inSection],
  );

  const handleAdd = async (candidate: Candidate) => {
    setPendingId(candidate.id);
    try {
      await homeSectionService.addItem(activeTab, candidate.id);
      // Read the server's ordering back rather than guessing it client-side.
      const fresh = await homeSectionService.getAdminSection(activeTab);
      setSection(fresh);
      setDraft(fresh.items);
      setIsDirty(true);
      toast.success(`Added "${candidate.name}"`);
    } catch (err) {
      toast.error("Could not add product", {
        description: getSafeErrorMessage(err),
      });
    } finally {
      setPendingId(null);
    }
  };

  const handleRemove = async (item: AdminSectionItem) => {
    try {
      await homeSectionService.removeItem(activeTab, item.productId);
      setDraft((prev) => prev.filter((i) => i.productId !== item.productId));
      setIsDirty(true);
    } catch (err) {
      toast.error("Could not remove product", {
        description: getSafeErrorMessage(err),
      });
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.length) return;
    setDraft((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await homeSectionService.replaceItems(
        activeTab,
        draft.map((i) => i.productId),
      );

      const updatedCats = await homeSectionService.replaceCategories(
        activeTab,
        draftCategories.map((c) => c.categoryId),
      );

      setSection(updatedCats);
      setDraft(updatedCats.items);
      setDraftCategories(updatedCats.categories);

      if (
        title !== updatedCats.title ||
        subtitle !== (updatedCats.subtitle ?? "") ||
        isSectionActive !== updatedCats.isActive
      ) {
        await homeSectionService.updateSection(activeTab, {
          title,
          subtitle,
          isActive: isSectionActive,
        });
        const fresh = await homeSectionService.getAdminSection(activeTab);
        setSection(fresh);
        setDraft(fresh.items);
        setDraftCategories(fresh.categories);
        setTitle(fresh.title);
        setSubtitle(fresh.subtitle ?? "");
        setIsSectionActive(fresh.isActive);
      }

      setIsDirty(false);
      toast.success(`${section?.title ?? "Section"} saved`);
    } catch (err) {
      toast.error("Save failed", { description: getSafeErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Categories ───────────────────────────────────────────────────────────

  const loadCategories = useCallback(async () => {
    setIsLoadingCats(true);
    try {
      const res = await adminService.getCategoriesFlat();
      const list = (res?.data ?? res ?? []) as any[];
      setAllCategories(
        list.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          image: c.image ?? null,
        })),
      );
    } catch (err) {
      toast.error("Could not load categories", {
        description: getSafeErrorMessage(err),
      });
    } finally {
      setIsLoadingCats(false);
    }
  }, []);

  const pinnedCatIds = useMemo(
    () => new Set(draftCategories.map((c) => c.categoryId)),
    [draftCategories],
  );

  const availableCategories = useMemo(() => {
    const q = catQuery.trim().toLowerCase();
    return allCategories
      .filter((c) => !pinnedCatIds.has(c.id))
      .filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [allCategories, pinnedCatIds, catQuery]);

  const handleAddCategory = async (category: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
  }) => {
    setPendingCatId(category.id);
    try {
      await homeSectionService.addCategory(activeTab, category.id);
      const fresh = await homeSectionService.getAdminSection(activeTab);
      setDraftCategories(fresh.categories);
      setIsDirty(true);
      toast.success(`Pinned "${category.name}"`);
    } catch (err) {
      toast.error("Could not pin category", {
        description: getSafeErrorMessage(err),
      });
    } finally {
      setPendingCatId(null);
    }
  };

  const handleRemoveCategory = async (categoryId: string) => {
    try {
      await homeSectionService.removeCategory(activeTab, categoryId);
      setDraftCategories((prev) => prev.filter((c) => c.categoryId !== categoryId));
      setIsDirty(true);
    } catch (err) {
      toast.error("Could not unpin category", {
        description: getSafeErrorMessage(err),
      });
    }
  };

  const moveCategory = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draftCategories.length) return;
    setDraftCategories((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setIsDirty(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <LayoutGrid className="h-6 w-6" />
            Home Sections
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose which products appear behind the Quick / Shop All toggle on the storefront.
          </p>
        </div>
        <Button onClick={handleSave} disabled={!isDirty || isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save changes
        </Button>
      </div>

      {/* Section switcher */}
      <div className="inline-flex rounded-lg border p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={
              tab.key === activeTab
                ? "rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
                : "rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Copy settings */}
        <div className="space-y-4 rounded-lg border p-4 lg:col-span-1">
          <h2 className="font-semibold">Section settings</h2>

          <div className="space-y-2">
            <Label htmlFor="section-title">Title</Label>
            <Input
              id="section-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setIsDirty(true);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="section-subtitle">Subtitle</Label>
            <Input
              id="section-subtitle"
              value={subtitle}
              onChange={(e) => {
                setSubtitle(e.target.value);
                setIsDirty(true);
              }}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-2">
              {isSectionActive ? (
                <Eye className="h-4 w-4 text-green-600" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
              <Label htmlFor="section-active" className="text-sm">
                Visible on storefront
              </Label>
            </div>
            <Switch
              id="section-active"
              checked={isSectionActive}
              onCheckedChange={(v) => {
                setIsSectionActive(v);
                setIsDirty(true);
              }}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {TABS.find((t) => t.key === activeTab)?.hint}
          </p>
        </div>

        {/* Item list */}
        <div className="space-y-4 rounded-lg border p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              Products{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({draft.length})
              </span>
            </h2>

            <Dialog
              open={pickerOpen}
              onOpenChange={(open) => {
                setPickerOpen(open);
                if (open && candidates.length === 0) loadCandidates("");
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add products to {section?.title ?? activeTab}</DialogTitle>
                  <DialogDescription>
                    Search the catalogue and click a product to add it.
                  </DialogDescription>
                </DialogHeader>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search products..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      loadCandidates(e.target.value);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  {isSearching ? (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : availableCandidates.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <PackageX className="h-7 w-7 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Nothing to add here.
                      </p>
                    </div>
                  ) : (
                    availableCandidates.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        disabled={pendingId === c.id}
                        onClick={() => handleAdd(c)}
                        className="flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors hover:bg-muted disabled:opacity-50"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-muted">
                          {c.image && (
                            <Image
                              src={getImageUrl(c.image)}
                              alt={c.name}
                              fill
                              sizes="48px"
                              className="object-contain"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.brand ? `${c.brand} · ` : ""}
                            {formatCurrency(c.price)}
                          </p>
                        </div>
                        {pendingId === c.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : draft.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <PackageX className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No products in this section yet.
              </p>
              <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add the first product
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {draft.map((item, index) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border p-2"
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />

                  <span className="w-6 shrink-0 text-center text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </span>

                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-muted">
                    {item.image && (
                      <Image
                        src={getImageUrl(item.image)}
                        alt={item.alt}
                        fill
                        sizes="48px"
                        className="object-contain"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.brand ? `${item.brand} · ` : ""}
                      {formatCurrency(item.price)}
                    </p>
                  </div>

                  {item.discount > 0 && (
                    <Badge variant="destructive" className="shrink-0 text-[10px]">
                      {item.discount}% OFF
                    </Badge>
                  )}

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      aria-label="Move up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === draft.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label="Move down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleRemove(item)}
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Pinned categories → filter chips on the storefront */}
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <Tags className="h-4 w-4" />
            Categories
            <span className="text-sm font-normal text-muted-foreground">
              ({draftCategories.length})
            </span>
          </h2>

          <Dialog
            open={catPickerOpen}
            onOpenChange={(open) => {
              setCatPickerOpen(open);
              if (open && allCategories.length === 0) loadCategories();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Pin category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Pin categories to {section?.title ?? activeTab}</DialogTitle>
                <DialogDescription>
                  Pinned categories appear as filter chips above the products.
                </DialogDescription>
              </DialogHeader>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search categories..."
                  value={catQuery}
                  onChange={(e) => setCatQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                {isLoadingCats ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))
                ) : availableCategories.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <PackageX className="h-7 w-7 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No categories to pin.
                    </p>
                  </div>
                ) : (
                  availableCategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={pendingCatId === c.id}
                      onClick={() => handleAddCategory(c)}
                      className="flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
                        {c.image && (
                          <Image
                            src={getImageUrl(c.image)}
                            alt={c.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.slug}
                        </p>
                      </div>
                      {pendingCatId === c.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          These render as chips on the storefront so shoppers can filter the section.
        </p>

        {isLoading ? (
          <div className="mt-4 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : draftCategories.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
            <Tags className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No categories pinned to this section.
            </p>
            <Button size="sm" variant="outline" onClick={() => setCatPickerOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Pin a category
            </Button>
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {draftCategories.map((category, index) => (
              <li
                key={category.id}
                className="flex items-center gap-3 rounded-lg border p-2"
              >
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="w-6 shrink-0 text-center text-xs font-medium text-muted-foreground">
                  {index + 1}
                </span>
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
                  {category.image && (
                    <Image
                      src={getImageUrl(category.image)}
                      alt={category.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{category.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {category.slug}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === 0}
                    onClick={() => moveCategory(index, -1)}
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === draftCategories.length - 1}
                    onClick={() => moveCategory(index, 1)}
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleRemoveCategory(category.categoryId)}
                    aria-label="Unpin"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
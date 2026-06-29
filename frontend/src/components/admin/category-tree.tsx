"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  GripVertical,
  FolderTree,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryTreeProps {
  categories: Category[];
  onDelete?: (id: string) => void;
  onReorder?: (orders: { id: string; sortOrder: number }[]) => Promise<void> | void;
}

interface CategoryNodeProps {
  category: Category;
  level: number;
  onDelete: (id: string) => void;
  onReorderAt: (draggedId: string, targetId: string, position: "before" | "after") => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  draggingId: string | null;
  dropTargetId: string | null;
  dropPosition: "before" | "after" | null;
  expanded: Set<string>;
  toggleExpanded: (id: string) => void;
}

function CategoryNode({
  category,
  level,
  onDelete,
  onReorderAt,
  onDragStart,
  onDragEnd,
  draggingId,
  dropTargetId,
  dropPosition,
  expanded,
  toggleExpanded,
}: CategoryNodeProps) {
  const catId = (category as any)._id || (category as any).id;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const isExpanded = expanded.has(catId);
  const hasChildren = category.children && category.children.length > 0;
  const isDragging = draggingId === catId;
  const isDropTarget = dropTargetId === catId;
  const isSelfDrag = draggingId === catId;

  return (
    <div>
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", catId);
          onDragStart(catId);
        }}
        onDragEnd={onDragEnd}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const position = e.clientY < rect.top + rect.height / 2 ? "before" : "after";
          onReorderAt(draggingId || "", catId, position);
        }}
        onDrop={(e) => {
          e.preventDefault();
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const position = e.clientY < rect.top + rect.height / 2 ? "before" : "after";
          onReorderAt(draggingId || "", catId, position);
        }}
        className={cn(
          "group relative flex items-center gap-2 border-b px-4 py-3 transition-all",
          !category.isActive && "opacity-60",
          isDragging && "opacity-40",
          isDropTarget && dropPosition === "before" && "border-t-2 border-t-indigo-500",
          isDropTarget && dropPosition === "after" && "border-b-2 border-b-indigo-500",
          !isSelfDrag && "hover:bg-muted/50 cursor-grab active:cursor-grabbing"
        )}
        style={{ paddingLeft: `${level * 24 + 16}px` }}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />

        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(catId)}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
            type="button"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="h-6 w-6" />
        )}

        <div className="flex flex-1 items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
            <FolderTree className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <Link
              href={`/admin/categories/${catId}/edit`}
              className="font-medium text-foreground hover:text-primary"
            >
              {category.name}
            </Link>
            <p className="text-xs text-muted-foreground">/{category.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {(category as any).productCount ?? (category as any)._count?.products ?? 0} products
          </span>
          <Badge variant={category.isActive ? "success" : "secondary"}>
            {category.isActive ? "Active" : "Inactive"}
          </Badge>
          <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/admin/categories/${catId}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/categories/new?parent=${catId}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subcategory
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {category.children!.map((child) => (
            <CategoryNode
              key={(child as any)._id || (child as any).id}
              category={child}
              level={level + 1}
              onDelete={onDelete}
              onReorderAt={onReorderAt}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              draggingId={draggingId}
              dropTargetId={dropTargetId}
              dropPosition={dropPosition}
              expanded={expanded}
              toggleExpanded={toggleExpanded}
            />
          ))}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{category.name}&quot;? This
              will also delete all subcategories. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(catId);
                setDeleteDialogOpen(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function CategoryTree({ categories, onDelete, onReorder }: CategoryTreeProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"before" | "after" | null>(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const init = new Set<string>();
    categories.forEach((c) => {
      const id = (c as any)._id || (c as any).id;
      if (c.children && c.children.length > 0) init.add(id);
    });
    return init;
  });

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDragStart = useCallback((id: string) => {
    setDraggingId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDropTargetId(null);
    setDropPosition(null);
  }, []);

  const handleReorderAt = useCallback(
    (draggedId: string, targetId: string, position: "before" | "after") => {
      if (!draggedId || draggedId === targetId) return;
      setDropTargetId(targetId);
      setDropPosition(position);
    },
    []
  );

  const handleDrop = useCallback(
    async (draggedId: string, targetId: string, position: "before" | "after") => {
      if (!onReorder) return;
      // Build flat list of all top-level categories
      const flat = [...categories];
      const fromIdx = flat.findIndex((c) => ((c as any)._id || (c as any).id) === draggedId);
      const toIdx = flat.findIndex((c) => ((c as any)._id || (c as any).id) === targetId);
      if (fromIdx === -1 || toIdx === -1) return;

      const [moved] = flat.splice(fromIdx, 1);
      const insertAt = position === "before" ? toIdx : toIdx + 1;
      flat.splice(insertAt, 0, moved);

      const orders = flat.map((c, idx) => ({
        id: (c as any)._id || (c as any).id,
        sortOrder: idx + 1,
      }));

      setSaving(true);
      try {
        await onReorder(orders);
      } finally {
        setSaving(false);
        handleDragEnd();
      }
    },
    [categories, onReorder, handleDragEnd]
  );

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={<FolderTree className="h-12 w-12 text-muted-foreground" />}
        title="No categories found"
        description="Create your first category to get started"
        action={
          <Button asChild>
            <Link href="/admin/categories/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-semibold">Category Tree</h3>
          <p className="text-xs text-muted-foreground">
            Drag categories to reorder. Changes save automatically.
          </p>
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving order...
          </div>
        )}
      </div>
      <div
        onDrop={(e) => {
          e.preventDefault();
          if (draggingId && dropTargetId) {
            handleDrop(draggingId, dropTargetId, dropPosition || "after");
          }
        }}
      >
        {categories.map((category) => {
          const id = (category as any)._id || (category as any).id;
          return (
            <CategoryNode
              key={id}
              category={category}
              level={0}
              onDelete={onDelete || (() => {})}
              onReorderAt={(dragged, target, position) => {
                handleReorderAt(dragged, target, position);
                // Trigger save on drop
                if (dragged && target && dragged !== target) {
                  handleDrop(dragged, target, position);
                }
              }}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              draggingId={draggingId}
              dropTargetId={dropTargetId}
              dropPosition={dropPosition}
              expanded={expanded}
              toggleExpanded={toggleExpanded}
            />
          );
        })}
      </div>
    </div>
  );
}

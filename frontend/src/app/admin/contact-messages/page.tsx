"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  Loader2,
  Trash2,
  Eye,
  Clock,
  CheckCircle2,
  CircleDot,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/safe-error";
import { contactService, type ContactMessage } from "@/services/contact.service";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  new: { label: "New", color: "bg-blue-100 text-blue-700", icon: CircleDot },
  read: { label: "Read", color: "bg-amber-100 text-amber-700", icon: Eye },
  replied: { label: "Replied", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-600", icon: Clock },
};

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    load();
  }, [page, filter]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await contactService.getAll({ page, limit: 20, status: filter || undefined });
      const data = res?.data || res;
      setMessages(data?.messages || []);
      setTotal(data?.total || 0);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      toast.error("Failed to load messages", { description: getSafeErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await contactService.updateStatus(id, status);
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
      if (selected?.id === id) setSelected((prev) => (prev ? { ...prev, status } : null));
      toast.success("Status updated");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      await contactService.delete(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success("Message deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contact Messages</h1>
        <p className="text-sm text-muted-foreground">{total} total messages</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["", "new", "read", "replied", "closed"].map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => { setFilter(s); setPage(1); }}
          >
            {s || "All"}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* List */}
        <div className="lg:col-span-2 space-y-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">No messages found</div>
          ) : (
            messages.map((msg) => {
              const st = STATUS_MAP[msg.status] || STATUS_MAP.new;
              const StIcon = st.icon;
              return (
                <button
                  key={msg.id}
                  onClick={() => {
                    setSelected(msg);
                    if (msg.status === "new") handleStatusChange(msg.id, "read");
                  }}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-all hover:shadow-sm",
                    selected?.id === msg.id ? "border-primary bg-primary/5" : "bg-card"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{msg.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{msg.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={cn("shrink-0 text-[10px]", st.color)}>
                      <StIcon className="mr-1 h-3 w-3" />
                      {st.label}
                    </Badge>
                  </div>
                </button>
              );
            })
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-3">
          {selected ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selected.subject}</CardTitle>
                    <CardDescription>
                      From: {selected.name} ({selected.email})
                      {selected.phone && ` · ${selected.phone}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    {["new", "read", "replied", "closed"].map((s) => (
                      <Button
                        key={s}
                        variant={selected.status === s ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusChange(selected.id, s)}
                      >
                        {s}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(selected.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Category: <strong>{selected.category}</strong></span>
                  <span>Date: {new Date(selected.createdAt).toLocaleString()}</span>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="whitespace-pre-wrap text-sm">{selected.message}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border bg-card py-20 text-muted-foreground">
              Select a message to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

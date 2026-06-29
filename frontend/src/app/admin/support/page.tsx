"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Headphones,
  Search,
  Filter,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  Send,
  User as UserIcon,
  Mail,
  Calendar,
  Tag,
  AlertCircle,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import { supportService } from "@/services/support.service";
import { getSafeErrorMessage, isAuthError } from "@/lib/safe-error";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  OPEN: { label: "Open", color: "bg-blue-100 text-blue-700", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "bg-amber-100 text-amber-700", icon: MessageSquare },
  RESOLVED: { label: "Resolved", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  CLOSED: { label: "Closed", color: "bg-gray-100 text-gray-700", icon: CheckCircle2 },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: "Low", color: "bg-gray-100 text-gray-700" },
  MEDIUM: { label: "Medium", color: "bg-amber-100 text-amber-700" },
  HIGH: { label: "High", color: "bg-orange-100 text-orange-700" },
  URGENT: { label: "Urgent", color: "bg-red-100 text-red-700" },
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priority" },
  { value: "URGENT", label: "Urgent" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

function TicketRowSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminSupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (priorityFilter !== "all") params.priority = priorityFilter;
      const res = await supportService.getAllTickets(params);
      const data = res?.data?.data || res?.data || res;
      const list = Array.isArray(data) ? data : (data?.tickets || []);
      setTickets(list);
    } catch (err: any) {
      if (isAuthError(err)) {
        toast.error("Please login to view support tickets");
        router.push("/login");
        return;
      }
      toast.error("Failed to load tickets", { description: getSafeErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [router, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const fetchTicketDetails = async (ticketId: string) => {
    setLoadingTicket(true);
    setMessages([]);
    try {
      const [ticketRes, msgsRes] = await Promise.all([
        supportService.getTicketById(ticketId),
        supportService.getMessages(ticketId).catch(() => ({ data: [] })),
      ]);
      const t = ticketRes?.data?.data || ticketRes?.data || ticketRes;
      const m = msgsRes?.data?.data || msgsRes?.data || msgsRes;
      setSelectedTicket(t);
      setMessages(Array.isArray(m) ? m : []);
    } catch (err: any) {
      toast.error("Failed to load ticket", { description: getSafeErrorMessage(err) });
    } finally {
      setLoadingTicket(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    setSendingMessage(true);
    try {
      const res = await supportService.addMessage(selectedTicket.id || selectedTicket._id, {
        message: newMessage.trim(),
      });
      const m = res?.data?.data || res?.data || res;
      if (m) setMessages((prev) => [...prev, m]);
      setNewMessage("");
      toast.success("Reply sent");
    } catch (err: any) {
      toast.error("Failed to send reply", { description: getSafeErrorMessage(err) });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedTicket) return;
    setUpdatingStatus(true);
    try {
      const res = await supportService.updateTicketStatus(selectedTicket.id || selectedTicket._id, {
        status: newStatus,
      });
      const t = res?.data?.data || res?.data || res;
      setSelectedTicket(t);
      toast.success(`Status updated to ${newStatus}`);
      fetchTickets();
    } catch (err: any) {
      toast.error("Failed to update status", { description: getSafeErrorMessage(err) });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (t.subject || "").toLowerCase().includes(s) ||
      (t.description || "").toLowerCase().includes(s) ||
      (t.user?.email || "").toLowerCase().includes(s) ||
      (t.user?.firstName || "").toLowerCase().includes(s)
    );
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "OPEN").length,
    inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    resolved: tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length,
    urgent: tickets.filter((t) => t.priority === "URGENT").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer support tickets and respond to inquiries
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Open</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{stats.open}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">In Progress</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Resolved</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.resolved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Urgent</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{stats.urgent}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by subject, email, name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets list */}
      <div className="space-y-3">
        {loading ? (
          <>
            <TicketRowSkeleton />
            <TicketRowSkeleton />
            <TicketRowSkeleton />
          </>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Headphones className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-1 text-base font-semibold text-foreground">No tickets found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                  ? "Try changing your filters"
                  : "No support tickets have been created yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => {
            const status = String(ticket.status || "OPEN").toUpperCase();
            const priority = String(ticket.priority || "MEDIUM").toUpperCase();
            const sc = statusConfig[status] || statusConfig.OPEN;
            const pc = priorityConfig[priority] || priorityConfig.MEDIUM;
            const StatusIcon = sc.icon;
            const user = ticket.user || {};
            const userName = user.firstName
              ? `${user.firstName} ${user.lastName || ""}`.trim()
              : user.name || user.email || "Customer";
            return (
              <Card
                key={ticket.id || ticket._id}
                className="cursor-pointer transition-all hover:border-indigo-300 hover:shadow-sm"
                onClick={() => fetchTicketDetails(ticket.id || ticket._id)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge className={sc.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {sc.label}
                        </Badge>
                        <Badge variant="outline" className={pc.color}>
                          {pc.label}
                        </Badge>
                      </div>
                      <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
                        {ticket.subject}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {ticket.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          {userName}
                        </span>
                        {user.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(ticket.createdAt, "MMM dd, yyyy hh:mm a")}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Ticket detail modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
              <div className="flex-1 min-w-0">
                <h2 className="truncate text-lg font-semibold text-foreground">
                  {selectedTicket.subject}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Ticket #{String(selectedTicket.id || selectedTicket._id).slice(-8).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="rounded-lg p-1.5 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              {/* Status & priority */}
              <div className="flex flex-wrap items-center gap-2">
                {(() => {
                  const status = String(selectedTicket.status || "OPEN").toUpperCase();
                  const priority = String(selectedTicket.priority || "MEDIUM").toUpperCase();
                  const sc = statusConfig[status] || statusConfig.OPEN;
                  const pc = priorityConfig[priority] || priorityConfig.MEDIUM;
                  return (
                    <>
                      <Badge className={sc.color}>
                        {sc.label}
                      </Badge>
                      <Badge variant="outline" className={pc.color}>
                        {pc.label}
                      </Badge>
                    </>
                  );
                })()}
              </div>

              {/* Customer info */}
              {selectedTicket.user && (
                <div className="rounded-lg border bg-gray-50 p-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Customer
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedTicket.user.firstName
                      ? `${selectedTicket.user.firstName} ${selectedTicket.user.lastName || ""}`.trim()
                      : selectedTicket.user.name || "Customer"}
                  </p>
                  {selectedTicket.user.email && (
                    <p className="text-xs text-muted-foreground">{selectedTicket.user.email}</p>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Description
                </p>
                <div className="rounded-lg border bg-white p-3 text-sm text-foreground whitespace-pre-wrap">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Status update */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Update Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => {
                    const current = String(selectedTicket.status || "").toUpperCase();
                    const isCurrent = current === s;
                    return (
                      <button
                        key={s}
                        onClick={() => !isCurrent && handleUpdateStatus(s)}
                        disabled={isCurrent || updatingStatus}
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                          isCurrent
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium cursor-default"
                            : "border-gray-200 text-muted-foreground hover:border-gray-300 disabled:opacity-50"
                        }`}
                      >
                        {updatingStatus ? <Loader2 className="inline h-3 w-3 animate-spin mr-1" /> : null}
                        {s.replace("_", " ")}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Messages */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Conversation ({messages.length})
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {loadingTicket ? (
                    <Skeleton className="h-16 w-full" />
                  ) : messages.length === 0 ? (
                    <p className="rounded-lg border bg-gray-50 p-3 text-center text-xs text-muted-foreground">
                      No replies yet
                    </p>
                  ) : (
                    messages.map((msg: any, idx: number) => {
                      const isAdmin = msg.senderRole === "ADMIN" || msg.isAdmin || msg.sender?.role === "ADMIN";
                      return (
                        <div
                          key={msg.id || msg._id || idx}
                          className={`rounded-lg border p-3 text-sm ${
                            isAdmin ? "bg-indigo-50 border-indigo-200" : "bg-white"
                          }`}
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <p className="text-xs font-medium text-foreground">
                              {msg.sender?.firstName
                                ? `${msg.sender.firstName} ${msg.sender.lastName || ""}`.trim()
                                : msg.senderName || (isAdmin ? "Admin" : "Customer")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(msg.createdAt, "MMM dd, hh:mm a")}
                            </p>
                          </div>
                          <p className="whitespace-pre-wrap text-foreground">{msg.message || msg.content}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Reply */}
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Send Reply
                </p>
                <Textarea
                  placeholder="Type your reply..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    {sendingMessage ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Send Reply
                  </Button>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3 rounded-lg border bg-gray-50 p-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="text-foreground">{formatDate(selectedTicket.createdAt, "MMM dd, yyyy hh:mm a")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last updated</p>
                  <p className="text-foreground">{formatDate(selectedTicket.updatedAt, "MMM dd, yyyy hh:mm a")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

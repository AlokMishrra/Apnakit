"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  User as UserIcon,
  Mail,
  Calendar,
  AlertCircle,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: "Low", color: "bg-gray-100 text-gray-700" },
  MEDIUM: { label: "Medium", color: "bg-amber-100 text-amber-700" },
  HIGH: { label: "High", color: "bg-orange-100 text-orange-700" },
  URGENT: { label: "Urgent", color: "bg-red-100 text-red-700" },
};

function TicketSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton variant="circular" className="h-8 w-8" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: ticketId } = use(params);
  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchTicket = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ticketRes, msgsRes] = await Promise.all([
        supportService.getTicketById(ticketId),
        supportService.getMessages(ticketId).catch(() => ({ data: [] })),
      ]);
      const t = ticketRes?.data || ticketRes;
      const m = msgsRes?.data || msgsRes;
      const ticketData = t?.data || t;
      const messagesList = Array.isArray(m) ? m : (m?.data || []);
      if (!ticketData || (!ticketData.id && !ticketData._id)) {
        setError("This ticket could not be found. It may have been deleted or you may not have permission to view it.");
        return;
      }
      setTicket(ticketData);
      setMessages(messagesList);
    } catch (err: any) {
      if (isAuthError(err)) {
        toast.error("Please sign in to view this ticket");
        router.push("/login?redirect=/account/support");
        return;
      }
      const msg = getSafeErrorMessage(err, "Failed to load ticket details. Please try again.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [ticketId, router]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticket) return;
    setSending(true);
    try {
      const res = await supportService.addMessage(ticket.id || ticket._id, {
        message: newMessage.trim(),
      });
      const m = res?.data || res;
      const newMsg = m?.data || m;
      if (newMsg) setMessages((prev) => [...prev, newMsg]);
      setNewMessage("");
      toast.success("Message sent");
    } catch (err: any) {
      toast.error("Failed to send message", { description: getSafeErrorMessage(err) });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <TicketSkeleton />
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">Ticket Not Found</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {error || "Ticket details are not available."}
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={fetchTicket}>
                Try Again
              </Button>
              <Button asChild>
                <Link href="/account/support">Back to Tickets</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const status = String(ticket.status || "OPEN").toUpperCase();
  const priority = String(ticket.priority || "MEDIUM").toUpperCase();
  const sc = statusConfig[status] || statusConfig.OPEN;
  const pc = priorityConfig[priority] || priorityConfig.MEDIUM;
  const StatusIcon = sc.icon;
  const ticketIdStr = ticket.id || ticket._id;
  const isClosed = status === "CLOSED" || status === "CANCELLED" || status === "RESOLVED";

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/account/support"
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Back to tickets"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-foreground sm:text-xl">
                {ticket.subject}
              </h1>
              <p className="text-xs text-muted-foreground">
                Ticket #{String(ticketIdStr).slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={sc.color}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {sc.label}
            </Badge>
            <Badge variant="outline" className={pc.color}>
              {pc.label}
            </Badge>
          </div>
        </div>

        <div className="space-y-4">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {ticket.description}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created {formatDate(ticket.createdAt, "MMM dd, yyyy hh:mm a")}
                </span>
                {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Updated {formatDate(ticket.updatedAt, "MMM dd, yyyy hh:mm a")}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Conversation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Conversation ({messages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No replies yet. Our team will respond within 24 hours.
                </p>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg: any, idx: number) => {
                    const isAdmin =
                      msg.senderRole === "ADMIN" ||
                      msg.isAdmin ||
                      msg.sender?.role === "ADMIN";
                    return (
                      <div
                        key={msg.id || msg._id || idx}
                        className={`flex gap-3 ${isAdmin ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                            isAdmin
                              ? "bg-indigo-100 text-indigo-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {isAdmin ? "A" : "Y"}
                        </div>
                        <div
                          className={`flex-1 max-w-[80%] rounded-lg border p-3 ${
                            isAdmin ? "bg-indigo-50/50 border-indigo-100" : "bg-white"
                          }`}
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <p className="text-xs font-medium text-foreground">
                              {msg.sender?.firstName
                                ? `${msg.sender.firstName} ${msg.sender.lastName || ""}`.trim()
                                : msg.senderName || (isAdmin ? "Support Agent" : "You")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(msg.createdAt, "MMM dd, hh:mm a")}
                            </p>
                          </div>
                          <p className="whitespace-pre-wrap text-sm text-foreground">
                            {msg.message || msg.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reply */}
          {!isClosed && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add a Reply</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                  maxLength={2000}
                />
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {newMessage.length}/2000
                  </p>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                  >
                    {sending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Send Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isClosed && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  This ticket is {sc.label.toLowerCase()}. Replies are disabled.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

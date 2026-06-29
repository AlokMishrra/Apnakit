"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Headphones,
  Plus,
  Loader2,
  MessageSquare,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Search,
  Filter,
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
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
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

export default function SupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "MEDIUM",
  });

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await supportService.getTickets();
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
  }, [router]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSubmit = async () => {
    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error("Please fill in subject and description");
      return;
    }
    try {
      setSubmitting(true);
      const res = await supportService.createTicket({
        subject: formData.subject,
        description: formData.description,
        priority: formData.priority,
      });
      toast.success("Support ticket created!", {
        description: "We'll get back to you soon",
      });
      setFormData({ subject: "", description: "", priority: "MEDIUM" });
      setShowNewForm(false);
      fetchTickets();
    } catch (err: any) {
      toast.error("Failed to create ticket", { description: getSafeErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = !searchTerm || t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || t.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support</h1>
          <p className="text-sm text-muted-foreground">Get help with your orders and account</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowNewForm(!showNewForm)}>
          <Plus className="mr-2 h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {showNewForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create Support Ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Subject *"
              placeholder="Brief description of your issue"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
            <div>
              <label className="text-sm font-medium text-foreground">Description *</label>
              <Textarea
                placeholder="Please describe your issue in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 min-h-[120px]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit Ticket
              </Button>
              <Button variant="outline" onClick={() => setShowNewForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <TicketSkeleton key={i} />)}
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Headphones className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold text-foreground">No support tickets</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm || statusFilter !== "all" ? "No tickets match your filters" : "Create a ticket to get help"}
            </p>
            <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowNewForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const id = ticket.id || ticket._id;
            const status = (ticket.status || "OPEN").toUpperCase();
            const priority = (ticket.priority || "MEDIUM").toUpperCase();
            const sc = statusConfig[status] || statusConfig.OPEN;
            const pc = priorityConfig[priority] || priorityConfig.MEDIUM;
            const StatusIcon = sc.icon;
            return (
              <Card
                key={id}
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => router.push(`/account/support/${id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground line-clamp-1">{ticket.subject}</h3>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{ticket.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <Badge className={sc.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {sc.label}
                        </Badge>
                        <Badge variant="outline" className={pc.color}>{pc.label}</Badge>
                        <span className="text-muted-foreground">{formatDate(ticket.createdAt, "MMM dd, yyyy")}</span>
                        {ticket._count?.messages !== undefined && (
                          <span className="text-muted-foreground">{ticket._count.messages} message{ticket._count.messages !== 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

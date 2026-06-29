"use client";

import { useState, useCallback } from "react";
import {
  Phone,
  MessageSquare,
  Mail,
  Clock,
  X,
  Loader2,
  Send,
  CheckCircle2,
  ChevronRight,
  Ticket,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supportService } from "@/services/support.service";
import { getSafeErrorMessage } from "@/lib/safe-error";
import { toast } from "sonner";

export interface ContactSupportContext {
  orderNumber?: string;
  orderId?: string;
  productName?: string;
  productId?: string;
  defaultSubject?: string;
}

interface ContactSupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: ContactSupportContext;
}

const SUPPORT_EMAIL = "support@apnakit.com";
const SUPPORT_HOURS = "Mon - Sat, 9:00 AM - 7:00 PM IST";

const QUICK_TOPICS = [
  { value: "order_status", label: "Order status & tracking", icon: "📦" },
  { value: "return_refund", label: "Return / Refund", icon: "↩️" },
  { value: "payment", label: "Payment issue", icon: "💳" },
  { value: "delivery", label: "Delivery problem", icon: "🚚" },
  { value: "product", label: "Product question", icon: "🛍️" },
  { value: "other", label: "Something else", icon: "💬" },
];

const PRIORITIES = [
  { value: "LOW", label: "Low", color: "bg-gray-100 text-gray-700" },
  { value: "MEDIUM", label: "Medium", color: "bg-amber-100 text-amber-700" },
  { value: "HIGH", label: "High", color: "bg-orange-100 text-orange-700" },
  { value: "URGENT", label: "Urgent", color: "bg-red-100 text-red-700" },
];

type View = "main" | "create-ticket" | "success";

export function ContactSupportDialog({ open, onOpenChange, context }: ContactSupportDialogProps) {
  const [view, setView] = useState<View>("main");
  const [submitting, setSubmitting] = useState(false);

  const [topic, setTopic] = useState<string>("order_status");
  const [subject, setSubject] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [priority, setPriority] = useState<string>("MEDIUM");
  const [createdTicketId, setCreatedTicketId] = useState<string>("");

  const reset = useCallback(() => {
    setView("main");
    setSubmitting(false);
    setTopic("order_status");
    setSubject(context?.defaultSubject || "");
    setDescription("");
    setPriority("MEDIUM");
    setCreatedTicketId("");
  }, [context?.defaultSubject]);

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleEmail = () => {
    const subject = context?.orderNumber
      ? `Help needed for order ${context.orderNumber}`
      : "Support request";
    const body = context?.orderNumber
      ? `Hi ApnaKit Support,%0A%0AI need help with order ${context.orderNumber}.%0A%0A`
      : "Hi ApnaKit Support,%0A%0A";
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${body}`;
  };

  const handleTopicSelect = (t: string) => {
    setTopic(t);
    if (!subject) {
      const topicLabel = QUICK_TOPICS.find((q) => q.value === t)?.label || "Support request";
      setSubject(
        context?.orderNumber
          ? `${topicLabel} - Order ${context.orderNumber}`
          : context?.productName
          ? `${topicLabel} - ${context.productName}`
          : topicLabel
      );
    }
    setView("create-ticket");
  };

  const handleSubmit = async () => {
    if (!subject.trim() || subject.trim().length < 3) {
      toast.error("Please enter a subject (at least 3 characters)");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      toast.error("Please describe your issue (at least 10 characters)");
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        subject: subject.trim(),
        description: context?.orderNumber
          ? `${description.trim()}\n\n— Order: ${context.orderNumber}`
          : description.trim(),
        priority,
      };
      const res = await supportService.createTicket(payload);
      const data = res?.data?.data || res?.data || res;
      const ticketId = data?.id || data?._id || data?.ticketNumber || "";
      setCreatedTicketId(ticketId);
      setView("success");
      toast.success("Support ticket created!", {
        description: "Our team will respond within 24 hours",
      });
    } catch (err: any) {
      const msg = getSafeErrorMessage(err, "Failed to create ticket. Please try again.");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewAllTickets = () => {
    handleOpenChange(false);
    window.location.href = "/account/support";
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0">
        {view === "main" && (
          <>
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-5 text-white">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                    <Headphones className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-white text-lg">Contact Support</DialogTitle>
                    <DialogDescription className="text-indigo-100 text-xs">
                      We're here to help, 7 days a week
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="space-y-4 p-5">
              {/* Order context banner */}
              {context?.orderNumber && (
                <div className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
                  <Ticket className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Regarding order</p>
                    <p className="text-sm font-medium text-foreground truncate">{context.orderNumber}</p>
                  </div>
                </div>
              )}

              {/* Quick contact options */}
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Quick Contact
                </p>

                <button
                  onClick={handleEmail}
                  className="group flex w-full items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-left transition-colors hover:bg-blue-100/80"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">Email Us</p>
                    <p className="text-xs text-muted-foreground truncate">{SUPPORT_EMAIL}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-blue-600 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              </div>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-2 text-muted-foreground">OR</span>
                </div>
              </div>

              {/* Create ticket */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Create a Support Ticket
                </p>
                <p className="mb-3 text-xs text-muted-foreground">
                  Choose a topic and we'll help you with it
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_TOPICS.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => handleTopicSelect(t.value)}
                      className="group flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50/50"
                    >
                      <span className="text-lg">{t.icon}</span>
                      <span className="flex-1 text-xs font-medium text-foreground line-clamp-1">
                        {t.label}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Support hours: {SUPPORT_HOURS}</span>
              </div>
            </div>
          </>
        )}

        {view === "create-ticket" && (
          <>
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView("main")}
                  className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100"
                  aria-label="Back"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </button>
                <DialogHeader>
                  <DialogTitle className="text-base">Create Ticket</DialogTitle>
                </DialogHeader>
              </div>
            </div>

            <div className="space-y-4 p-4">
              {context?.orderNumber && (
                <div className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-2.5 text-xs">
                  <Ticket className="h-3.5 w-3.5 text-indigo-600 flex-shrink-0" />
                  <span className="text-muted-foreground">Order:</span>
                  <span className="font-medium text-foreground">{context.orderNumber}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Topic <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TOPICS.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTopic(t.value)}
                      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                        topic === t.value
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium"
                          : "border-gray-200 text-muted-foreground hover:border-gray-300"
                      }`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Subject <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Brief summary of your issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={120}
                />
                <p className="text-xs text-muted-foreground">{subject.length}/120</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Describe your issue <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Please provide as much detail as possible..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground">{description.length}/1000</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Priority</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPriority(p.value)}
                      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                        priority === p.value
                          ? `${p.color} border-transparent font-medium`
                          : "border-gray-200 text-muted-foreground hover:border-gray-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-t bg-gray-50 p-4">
              <Button
                variant="outline"
                onClick={() => setView("main")}
                disabled={submitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !subject.trim() ||
                  subject.trim().length < 3 ||
                  !description.trim() ||
                  description.trim().length < 10
                }
                className="flex-1"
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit Ticket
              </Button>
            </div>
          </>
        )}

        {view === "success" && (
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-center text-lg">Ticket Created!</DialogTitle>
              <DialogDescription className="text-center">
                Your support ticket has been submitted. Our team will get back to you within 24 hours.
              </DialogDescription>
            </DialogHeader>
            {createdTicketId && (
              <div className="my-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs text-muted-foreground">Ticket ID</p>
                <p className="font-mono text-sm font-semibold text-foreground">{createdTicketId}</p>
              </div>
            )}
            <div className="mt-4 flex flex-col gap-2">
              <Button onClick={handleViewAllTickets} className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                View My Tickets
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  reset();
                  handleOpenChange(false);
                }}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Headphones(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

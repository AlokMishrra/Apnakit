"use client";

import { useState } from "react";
import {
  Mail,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Headphones,
  HelpCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { contactService } from "@/services/contact.service";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/safe-error";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "general",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await contactService.submit({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.subject,
        category: formData.category,
        message: formData.message,
      });
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", subject: "", category: "general", message: "" });
      toast.success("Message sent!", { description: "We'll get back to you within 24 hours." });
    } catch (err) {
      toast.error("Failed to send message", { description: getSafeErrorMessage(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      description: "support@apnakit.in",
      subtext: "Response within 2 hours",
    },
    {
      icon: MapPin,
      title: "Visit Us",
      description: "Near Baal Vidhya Mandir School",
      subtext: "Chhutmalpur, Saharanpur 247662",
    },
    {
      icon: Clock,
      title: "Working Hours",
      description: "Mon - Sat: 9AM - 7PM",
      subtext: "Sun: 10AM - 4PM",
    },
  ];

  const categories = [
    { value: "general", label: "General Inquiry" },
    { value: "order", label: "Order Issue" },
    { value: "return", label: "Return/Refund" },
    { value: "payment", label: "Payment Issue" },
    { value: "delivery", label: "Delivery Issue" },
    { value: "seller", label: "Seller Support" },
    { value: "feedback", label: "Feedback" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="mb-12 text-center">
        <Badge className="mb-3">Contact Us</Badge>
        <h1 className="text-4xl font-bold mb-3">We&apos;d Love to Hear From You</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Have a question, suggestion, or need help? Our team is here to assist
          you with anything you need.
        </p>
      </div>

      {/* Contact Cards */}
      <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {contactInfo.map((info) => (
          <div
            key={info.title}
            className="rounded-xl border bg-card p-5 text-center shadow-sm transition-all hover:shadow-md"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <info.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">{info.title}</h3>
            <p className="text-sm font-medium">{info.description}</p>
            <p className="text-xs text-muted-foreground">{info.subtext}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Contact Form */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Send us a Message</h2>
            </div>

            {submitted && (
              <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
                <div className="flex items-center gap-2 text-green-800 mb-1">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="font-semibold">Message Sent Successfully!</p>
                </div>
                <p className="text-sm text-green-700">
                  We&apos;ll get back to you within 24 hours. Check your email
                  for updates.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-2 text-sm font-medium text-green-800 underline"
                >
                  Send another message
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Full Name *
                  </label>
                  <Input
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Email *
                  </label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Subject *
                </label>
                <Input
                  placeholder="What is this about?"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Message *
                </label>
                <Textarea
                  placeholder="Tell us more about your inquiry..."
                  rows={5}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  required
                />
              </div>

              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Support */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="font-bold mb-4">Quick Support</h3>
            <div className="space-y-3">
              <a
                href="/help"
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
              >
                <HelpCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Help Center</p>
                  <p className="text-xs text-muted-foreground">
                    Find answers to common questions
                  </p>
                </div>
              </a>
              <a
                href="/track-order"
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
              >
                <Headphones className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Track Order</p>
                  <p className="text-xs text-muted-foreground">
                    Check your order status in real-time
                  </p>
                </div>
              </a>
            </div>
          </div>

          {/* FAQ Teaser */}
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-6">
            <h3 className="font-bold mb-2">Looking for FAQs?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Check our Help Center for instant answers to the most common
              questions about orders, payments, returns, and more.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="/help">Visit Help Center</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Store,
  Truck,
  CreditCard,
  Bell,
  Search,
  Shield,
  Upload,
  Save,
  Plus,
  Trash2,
  Globe,
  Key,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const tabs = [
  { value: "general", label: "General", icon: Store },
  { value: "shipping", label: "Shipping", icon: Truck },
  { value: "payment", label: "Payment", icon: CreditCard },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "seo", label: "SEO", icon: Search },
  { value: "security", label: "Security", icon: Shield },
];

const shippingZones = [
  { id: 1, name: "Local (Same City)", rate: "₹49", freeAbove: "₹499", estimatedDays: "1-2" },
  { id: 2, name: "Regional (Same State)", rate: "₹99", freeAbove: "₹999", estimatedDays: "2-3" },
  { id: 3, name: "National (Pan India)", rate: "₹149", freeAbove: "₹1499", estimatedDays: "3-5" },
  { id: 4, name: "Express Delivery", rate: "₹299", freeAbove: "₹2999", estimatedDays: "1-2" },
];

const emailTemplates = [
  { name: "Order Confirmation", status: "active", lastEdited: "2 days ago" },
  { name: "Shipping Update", status: "active", lastEdited: "1 week ago" },
  { name: "Delivery Confirmation", status: "active", lastEdited: "3 days ago" },
  { name: "Return Approved", status: "active", lastEdited: "5 days ago" },
  { name: "Refund Processed", status: "active", lastEdited: "1 week ago" },
  { name: "Abandoned Cart", status: "inactive", lastEdited: "2 weeks ago" },
];

const sessions = [
  { device: "Chrome on Windows", ip: "192.168.1.1", lastActive: "Just now", current: true },
  { device: "Safari on iPhone", ip: "10.0.0.1", lastActive: "2 hours ago", current: false },
  { device: "Firefox on Linux", ip: "172.16.0.1", lastActive: "1 day ago", current: false },
];

const paymentMethods = [
  { name: "Razorpay", description: "UPI, Cards, Net Banking, Wallets", enabled: true, icon: "💳" },
  { name: "Cash on Delivery", description: "Pay when you receive your order", enabled: true, icon: "💵" },
  { name: "Stripe", description: "International card payments", enabled: false, icon: "🌐" },
  { name: "PayPal", description: "Global digital wallet payments", enabled: false, icon: "🅿️" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const handleSave = (section: string) => {
    toast.success(`${section} settings saved`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your store settings and configurations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full shrink-0 lg:w-64">
            <div className="sticky top-4">
              <TabsList className="flex h-auto w-full flex-col rounded-xl border bg-white p-2 shadow-sm lg:h-auto">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700"
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <TabsContent value="general" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Store Information</CardTitle>
                  <CardDescription>Basic information about your store</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Input label="Store Name" defaultValue="ApnaKit" />
                    <Input label="Store Email" defaultValue="support@apnakit.in" type="email" />
                    <Input label="Phone Number" defaultValue="+91 1800-123-4567" />
                    <Input label="Currency" defaultValue="INR (₹)" />
                    <Input label="Timezone" defaultValue="Asia/Kolkata (IST)" />
                    <Input label="Tax Rate (%)" defaultValue="18" type="number" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Store Logo</label>
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed bg-muted/50">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <Button variant="outline" size="sm">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Logo
                        </Button>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Recommended: 200x200px, PNG or SVG
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Store Description</label>
                    <textarea
                      defaultValue="ApnaKit - Your trusted online shopping destination for electronics, fashion, and more."
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => handleSave("Store")}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shipping" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Shipping Configuration</CardTitle>
                  <CardDescription>Configure shipping rates and zones</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Input label="Default Shipping Cost" defaultValue="149" type="number" />
                    <Input label="Free Shipping Threshold" defaultValue="1499" type="number" />
                    <Input label="Max Delivery Days" defaultValue="7" type="number" />
                    <Input label="Shipping Handling Time" defaultValue="1" type="number" />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="text-sm font-medium">Enable Free Shipping</p>
                      <p className="text-xs text-muted-foreground">
                        Offer free shipping above the threshold amount
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" defaultChecked className="peer sr-only" />
                      <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-violet-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                    </label>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">Shipping Zones</CardTitle>
                      <CardDescription>Define shipping rates for different regions</CardDescription>
                    </div>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Zone
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-xs font-medium uppercase text-muted-foreground">
                          <th className="pb-3 pr-4">Zone Name</th>
                          <th className="pb-3 pr-4">Rate</th>
                          <th className="pb-3 pr-4">Free Above</th>
                          <th className="pb-3 pr-4">Est. Days</th>
                          <th className="pb-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {shippingZones.map((zone) => (
                          <tr key={zone.id}>
                            <td className="py-3 pr-4 text-sm font-medium">{zone.name}</td>
                            <td className="py-3 pr-4 text-sm">{zone.rate}</td>
                            <td className="py-3 pr-4 text-sm">{zone.freeAbove}</td>
                            <td className="py-3 pr-4 text-sm">{zone.estimatedDays} days</td>
                            <td className="py-3 text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Payment Methods</CardTitle>
                  <CardDescription>Enable or disable payment methods</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.name}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{method.icon}</span>
                        <div>
                          <p className="text-sm font-medium">{method.name}</p>
                          <p className="text-xs text-muted-foreground">{method.description}</p>
                        </div>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          defaultChecked={method.enabled}
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-violet-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                      </label>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Razorpay Configuration</CardTitle>
                  <CardDescription>Configure your Razorpay payment gateway</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Key ID"
                    defaultValue="rzp_live_xxxxxxxxxxxxx"
                    type="password"
                    icon={<Key className="h-4 w-4" />}
                  />
                  <Input
                    label="Key Secret"
                    defaultValue="xxxxxxxxxxxxxxxxxxxxxxxx"
                    type="password"
                    icon={<Key className="h-4 w-4" />}
                  />
                  <Input label="Webhook URL" defaultValue="https://apnakit.in/api/webhooks/razorpay" readOnly />
                  <div className="flex justify-end">
                    <Button onClick={() => handleSave("Payment")}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Payment Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Email Templates</CardTitle>
                  <CardDescription>Manage email notification templates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {emailTemplates.map((template) => (
                      <div
                        key={template.name}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
                            <Bell className="h-5 w-5 text-violet-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{template.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Last edited: {template.lastEdited}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={template.status === "active" ? "success" : "secondary"}>
                            {template.status}
                          </Badge>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Default Meta Tags</CardTitle>
                  <CardDescription>Set default SEO meta tags for your store</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Meta Title"
                    defaultValue="ApnaKit - Online Shopping for Electronics, Fashion & More"
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Meta Description</label>
                    <textarea
                      defaultValue="Shop the best deals on electronics, fashion, home & kitchen items at ApnaKit. Free shipping on orders above ₹1499. Easy returns & secure payments."
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  <Input
                    label="Meta Keywords"
                    defaultValue="online shopping, ecommerce, electronics, fashion, ApnaKit"
                  />
                  <Input
                    label="Google Analytics ID"
                    defaultValue="G-XXXXXXXXXX"
                    icon={<Globe className="h-4 w-4" />}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-0 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Active Sessions</CardTitle>
                  <CardDescription>Manage active login sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sessions.map((session, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <Globe className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{session.device}</p>
                              {session.current && (
                                <Badge variant="success" className="text-[10px]">Current</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              IP: {session.ip} &middot; Last active: {session.lastActive}
                            </p>
                          </div>
                        </div>
                        {!session.current && (
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                            Revoke
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}

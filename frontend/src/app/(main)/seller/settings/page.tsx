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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sellerService } from "@/services/seller.service";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  Store,
  CreditCard,
  MapPin,
  Bell,
  Key,
  Percent,
  Upload,
  Save,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

export default function SellerSettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    businessName: "",
    description: "",
    email: "",
    phone: "",
    gstNumber: "",
    panNumber: "",
  });
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    branch: "",
  });
  const [notifications, setNotifications] = useState({
    newOrders: true,
    orderUpdates: true,
    lowStock: true,
    newReviews: true,
    payments: true,
    marketing: false,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await sellerService.getProfile();
      const data = res?.data?.data || res?.data || {};
      setProfile({
        businessName: data.businessName || data.shopName || "",
        description: data.description || data.shopDescription || "",
        email: data.email || "",
        phone: data.phone || "",
        gstNumber: data.gstNumber || "",
        panNumber: data.panNumber || "",
      });
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await sellerService.updateProfile(profile);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your seller account settings</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
          <TabsTrigger value="profile" className="text-xs sm:text-sm">
            <Store className="h-4 w-4 mr-1 sm:mr-2 hidden sm:block" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="bank" className="text-xs sm:text-sm">
            <CreditCard className="h-4 w-4 mr-1 sm:mr-2 hidden sm:block" />
            Bank
          </TabsTrigger>
          <TabsTrigger value="address" className="text-xs sm:text-sm">
            <MapPin className="h-4 w-4 mr-1 sm:mr-2 hidden sm:block" />
            Address
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs sm:text-sm">
            <Bell className="h-4 w-4 mr-1 sm:mr-2 hidden sm:block" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="api" className="text-xs sm:text-sm">
            <Key className="h-4 w-4 mr-1 sm:mr-2 hidden sm:block" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="commission" className="text-xs sm:text-sm">
            <Percent className="h-4 w-4 mr-1 sm:mr-2 hidden sm:block" />
            Commission
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Store className="h-10 w-10 text-gray-400" />
                </div>
                <div>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended: 200x200px, PNG or JPG
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Business Name"
                  value={profile.businessName}
                  onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
              <Textarea
                label="Business Description"
                value={profile.description}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="GST Number"
                  value={profile.gstNumber}
                  onChange={(e) => setProfile({ ...profile, gstNumber: e.target.value })}
                />
                <Input
                  label="PAN Number"
                  value={profile.panNumber}
                  onChange={(e) => setProfile({ ...profile, panNumber: e.target.value })}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle>Bank Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Account Number"
                  value={bankDetails.accountNumber}
                  onChange={(e) =>
                    setBankDetails({ ...bankDetails, accountNumber: e.target.value })
                  }
                />
                <Input
                  label="IFSC Code"
                  value={bankDetails.ifscCode}
                  onChange={(e) =>
                    setBankDetails({ ...bankDetails, ifscCode: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Bank Name"
                  value={bankDetails.bankName}
                  onChange={(e) =>
                    setBankDetails({ ...bankDetails, bankName: e.target.value })
                  }
                />
                <Input
                  label="Branch"
                  value={bankDetails.branch}
                  onChange={(e) =>
                    setBankDetails({ ...bankDetails, branch: e.target.value })
                  }
                />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  Bank details changes will be verified within 2-3 business days.
                </p>
              </div>
              <div className="flex justify-end">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Update Bank Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pickup Addresses</CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Address
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">Primary Warehouse</p>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Unit 12, Industrial Area, Andheri West
                      <br />
                      Mumbai, Maharashtra - 400053
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">Secondary Warehouse</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Plot 45, Sector 62, Noida
                      <br />
                      Uttar Pradesh - 201301
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "newOrders", label: "New Orders", desc: "Get notified when you receive a new order" },
                { key: "orderUpdates", label: "Order Updates", desc: "Status changes and cancellations" },
                { key: "lowStock", label: "Low Stock Alerts", desc: "When products are running low" },
                { key: "newReviews", label: "New Reviews", desc: "When customers leave reviews" },
                { key: "payments", label: "Payment Updates", desc: "Payment received and settlements" },
                { key: "marketing", label: "Marketing", desc: "Promotional offers and tips" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications[item.key as keyof typeof notifications]}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          [item.key]: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              ))}
              <div className="flex justify-end pt-4">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Use API keys to integrate your store with third-party services.
              </p>
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Production API Key</p>
                    <p className="text-xs text-muted-foreground">Created: Mar 15, 2024</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="bg-muted rounded px-3 py-2 font-mono text-sm">
                  {showApiKey
                    ? "nm_live_sk_7x9K2mN4pQ8rT3vW5yZ1"
                    : "nm_live_sk_••••••••••••••••••••••••"}
                </div>
              </div>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Generate New Key
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commission">
          <Card>
            <CardHeader>
              <CardTitle>Commission Rate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground">Your Commission Rate</p>
                <p className="text-4xl font-bold text-primary mt-2">
                  {profile.commissionRate || 5}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  on each sale
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Commission Structure</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Electronics</p>
                    <p className="text-xl font-bold mt-1">5%</p>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Clothing</p>
                    <p className="text-xl font-bold mt-1">8%</p>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Home & Garden</p>
                    <p className="text-xl font-bold mt-1">6%</p>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  Commission is calculated on the selling price (excluding GST and shipping).
                  Payments are settled weekly to your registered bank account.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

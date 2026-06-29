"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Store,
  User,
  Building2,
  CreditCard,
  MapPin,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  AlertCircle,
} from "lucide-react";

const steps = [
  { id: 1, label: "Personal Info", icon: User },
  { id: 2, label: "Business Info", icon: Building2 },
  { id: 3, label: "Bank Details", icon: CreditCard },
  { id: 4, label: "Pickup Address", icon: MapPin },
  { id: 5, label: "Verification", icon: FileCheck },
];

export default function SellerRegistrationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    personal: { firstName: "", lastName: "", email: "", phone: "" },
    business: { businessName: "", businessType: "", gstNumber: "", panNumber: "", description: "" },
    bank: { accountNumber: "", confirmAccount: "", ifscCode: "", bankName: "", branch: "" },
    address: { address: "", city: "", state: "", pincode: "", landmark: "" },
    documents: { aadhar: null as File | null, gst: null as File | null, pan: null as File | null },
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const updateFormData = (step: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [step]: { ...(prev[step as keyof typeof prev] as Record<string, unknown>), [field]: value },
    }));
  };

  const isStepComplete = () => {
    switch (currentStep) {
      case 1:
        return Object.values(formData.personal).every((v) => v);
      case 2:
        return Object.values(formData.business).every((v) => v);
      case 3:
        return Object.values(formData.bank).every((v) => v);
      case 4:
        return Object.values(formData.address).every((v) => v);
      default:
        return true;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ApnaKit" className="h-12 w-auto" />
        </div>
        <h1 className="text-2xl font-bold">Become a Seller</h1>
        <p className="text-muted-foreground mt-2">
          Start selling to millions of customers across India
        </p>
      </div>

      <div className="flex items-center justify-between mb-8 px-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  currentStep > step.id
                    ? "bg-primary text-primary-foreground"
                    : currentStep === step.id
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/20 ring-offset-2"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <span className="text-xs mt-2 text-center hidden sm:block">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-1 w-12 sm:w-20 mx-2 ${
                  currentStep > step.id ? "bg-primary" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStep === 1 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="Enter first name"
                  value={formData.personal.firstName}
                  onChange={(e) => updateFormData("personal", "firstName", e.target.value)}
                />
                <Input
                  label="Last Name"
                  placeholder="Enter last name"
                  value={formData.personal.lastName}
                  onChange={(e) => updateFormData("personal", "lastName", e.target.value)}
                />
              </div>
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={formData.personal.email}
                onChange={(e) => updateFormData("personal", "email", e.target.value)}
              />
              <Input
                label="Phone Number"
                placeholder="+91 98765 43210"
                value={formData.personal.phone}
                onChange={(e) => updateFormData("personal", "phone", e.target.value)}
              />
            </>
          )}

          {currentStep === 2 && (
            <>
              <Input
                label="Business Name"
                placeholder="Enter business name"
                value={formData.business.businessName}
                onChange={(e) => updateFormData("business", "businessName", e.target.value)}
              />
              <Select
                value={formData.business.businessType}
                onValueChange={(v) => updateFormData("business", "businessType", v)}
              >
                <SelectTrigger label="Business Type">
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sole_proprietorship" label="Sole Proprietorship" />
                  <SelectItem value="partnership" label="Partnership" />
                  <SelectItem value="private_limited" label="Private Limited" />
                  <SelectItem value="llp" label="LLP" />
                </SelectContent>
              </Select>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="GST Number"
                  placeholder="27AABCU9603R1ZM"
                  value={formData.business.gstNumber}
                  onChange={(e) => updateFormData("business", "gstNumber", e.target.value)}
                />
                <Input
                  label="PAN Number"
                  placeholder="AABCU9603R"
                  value={formData.business.panNumber}
                  onChange={(e) => updateFormData("business", "panNumber", e.target.value)}
                />
              </div>
              <Textarea
                label="Business Description"
                placeholder="Describe your business..."
                value={formData.business.description}
                onChange={(e) => updateFormData("business", "description", e.target.value)}
              />
            </>
          )}

          {currentStep === 3 && (
            <>
              <Input
                label="Account Number"
                placeholder="Enter bank account number"
                value={formData.bank.accountNumber}
                onChange={(e) => updateFormData("bank", "accountNumber", e.target.value)}
              />
              <Input
                label="Confirm Account Number"
                placeholder="Re-enter account number"
                value={formData.bank.confirmAccount}
                onChange={(e) => updateFormData("bank", "confirmAccount", e.target.value)}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="IFSC Code"
                  placeholder="SBIN0001234"
                  value={formData.bank.ifscCode}
                  onChange={(e) => updateFormData("bank", "ifscCode", e.target.value)}
                />
                <Input
                  label="Bank Name"
                  placeholder="State Bank of India"
                  value={formData.bank.bankName}
                  onChange={(e) => updateFormData("bank", "bankName", e.target.value)}
                />
              </div>
              <Input
                label="Branch"
                placeholder="Enter branch name"
                value={formData.bank.branch}
                onChange={(e) => updateFormData("bank", "branch", e.target.value)}
              />
            </>
          )}

          {currentStep === 4 && (
            <>
              <Textarea
                label="Pickup Address"
                placeholder="Enter complete pickup address"
                value={formData.address.address}
                onChange={(e) => updateFormData("address", "address", e.target.value)}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="City"
                  placeholder="Mumbai"
                  value={formData.address.city}
                  onChange={(e) => updateFormData("address", "city", e.target.value)}
                />
                <Input
                  label="State"
                  placeholder="Maharashtra"
                  value={formData.address.state}
                  onChange={(e) => updateFormData("address", "state", e.target.value)}
                />
                <Input
                  label="Pincode"
                  placeholder="400001"
                  value={formData.address.pincode}
                  onChange={(e) => updateFormData("address", "pincode", e.target.value)}
                />
              </div>
              <Input
                label="Landmark"
                placeholder="Near XYZ Mall"
                value={formData.address.landmark}
                onChange={(e) => updateFormData("address", "landmark", e.target.value)}
              />
            </>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Aadhar Card", key: "aadhar" },
                  { label: "GST Certificate", key: "gst" },
                  { label: "PAN Card", key: "pan" },
                ].map((doc) => (
                  <div
                    key={doc.key}
                    className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-medium">{doc.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, JPG (Max 5MB)</p>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Important</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Your documents will be verified within 2-3 business days. You will receive an
                    email once your seller account is approved.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">
                  I agree to the{" "}
                  <a href="#" className="text-primary hover:underline">
                    Terms & Conditions
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-primary hover:underline">
                    Seller Policy
                  </a>{" "}
                  of ApnaKit
                </span>
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((s) => s - 1)}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        {currentStep < steps.length ? (
          <Button onClick={() => setCurrentStep((s) => s + 1)} disabled={!isStepComplete()}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button disabled={!acceptedTerms}>
            Submit for Review
          </Button>
        )}
      </div>
    </div>
  );
}

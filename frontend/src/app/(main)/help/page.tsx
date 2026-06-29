"use client";

import { useState } from "react";
import {
  Search,
  HelpCircle,
  Package,
  CreditCard,
  RotateCcw,
  Truck,
  UserCircle,
  Shield,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const helpCategories = [
  { icon: Package, label: "Orders", slug: "orders" },
  { icon: CreditCard, label: "Payments", slug: "payments" },
  { icon: RotateCcw, label: "Returns", slug: "returns" },
  { icon: Truck, label: "Delivery", slug: "delivery" },
  { icon: UserCircle, label: "Account", slug: "account" },
  { icon: Shield, label: "Privacy", slug: "privacy" },
];

const faqs: Record<
  string,
  { question: string; answer: string }[]
> = {
  orders: [
    {
      question: "How do I place an order?",
      answer:
        "To place an order, simply browse our products, add items to your cart, and proceed to checkout. You'll need to provide shipping details and select a payment method. Once confirmed, you'll receive an order confirmation via email and SMS.",
    },
    {
      question: "Can I modify my order after placing it?",
      answer:
        "You can modify your order within 1 hour of placing it by going to 'My Orders' and selecting the order you want to modify. After 1 hour, the order enters processing and cannot be modified. In that case, you can cancel and place a new order.",
    },
    {
      question: "How do I cancel an order?",
      answer:
        "Go to My Orders > Select the order > Click 'Cancel Order'. You can cancel an order before it is shipped. If the order has already been shipped, you can refuse delivery or initiate a return after delivery.",
    },
    {
      question: "What is the order status meaning?",
      answer:
        "Order statuses: Pending (order placed), Confirmed (seller confirmed), Processing (being prepared), Shipped (handed to courier), Out for Delivery (on the way), Delivered (received), Cancelled (cancelled by you or seller).",
    },
    {
      question: "How do I track my order?",
      answer:
        "Once your order is shipped, you'll receive a tracking link via SMS and email. You can also track your order from My Orders > Track Order. Enter your order number on the tracking page for real-time updates.",
    },
  ],
  payments: [
    {
      question: "What payment methods are accepted?",
      answer:
        "We accept UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, Wallets, and Cash on Delivery (COD) for eligible orders.",
    },
    {
      question: "Is it safe to use my credit card on ApnaKit?",
      answer:
        "Absolutely. We use 256-bit SSL encryption and are PCI DSS compliant. Your card details are never stored on our servers. All transactions are processed through secure payment gateways.",
    },
    {
      question: "How do I get a refund?",
      answer:
        "Refunds are processed to your original payment method within 5-7 business days after the return is approved. For COD orders, refunds are credited to your ApnaKit wallet or bank account.",
    },
    {
      question: "What are the bank offers?",
      answer:
        "We regularly partner with banks to offer discounts. Check the Offers page or apply coupon codes at checkout for current bank offers. Offers vary and have specific terms and conditions.",
    },
  ],
  returns: [
    {
      question: "What is the return policy?",
      answer:
        "We offer a 7-day return policy for most items. Electronics have a 7-day return window, fashion items have 15 days, and some categories like groceries are non-returnable. Check the product page for specific return policy.",
    },
    {
      question: "How do I initiate a return?",
      answer:
        "Go to My Orders > Select the order > Click 'Return Item'. Select the item and reason for return. Schedule a pickup and the item will be collected from your address within 2-3 days.",
    },
    {
      question: "When will I receive my refund?",
      answer:
        "After the returned item is received and inspected at our warehouse (typically 2-3 days), the refund is initiated. It takes 5-7 business days for the refund to reflect in your account.",
    },
    {
      question: "Can I exchange an item instead of returning?",
      answer:
        "Yes, for select items you can opt for exchange instead of refund. Choose 'Exchange' while initiating the return and select the replacement item. Exchange is subject to availability.",
    },
  ],
  delivery: [
    {
      question: "What are the delivery charges?",
      answer:
        "Delivery is free for orders above ₹999. For orders below ₹999, a nominal delivery charge of ₹49-₹99 applies based on your location and order size.",
    },
    {
      question: "How long does delivery take?",
      answer:
        "Standard delivery takes 3-5 business days. Express delivery (available in select cities) delivers within 1-2 days. Delivery times may vary for remote areas and heavy items.",
    },
    {
      question: "Do you deliver to my area?",
      answer:
        "We deliver to 1000+ cities across India. Enter your pincode on any product page to check delivery availability. We're constantly expanding our delivery network.",
    },
    {
      question: "Can I change my delivery address?",
      answer:
        "You can change the delivery address before the order is shipped. Go to My Orders > Select order > Edit Address. After shipping, address changes are not possible.",
    },
  ],
  account: [
    {
      question: "How do I create an account?",
      answer:
        "Click on 'Sign Up' at the top right corner. You can register using your email address or phone number. Verify your account via OTP and you're all set!",
    },
    {
      question: "How do I reset my password?",
      answer:
        "Click 'Forgot Password' on the login page. Enter your registered email or phone number. You'll receive a reset link/OTP to create a new password.",
    },
    {
      question: "How do I update my profile information?",
      answer:
        "Go to Account > Profile Settings. Here you can update your name, email, phone number, and other details. Don't forget to save changes.",
    },
    {
      question: "How do I add or manage addresses?",
      answer:
        "Go to Account > Addresses. You can add new addresses, edit existing ones, or set a default address. You can save up to 10 addresses.",
    },
  ],
  privacy: [
    {
      question: "How is my data protected?",
      answer:
        "We use industry-standard encryption and security measures to protect your personal data. We never sell your information to third parties. Read our Privacy Policy for detailed information.",
    },
    {
      question: "Can I delete my account?",
      answer:
        "Yes, you can request account deletion from Account Settings > Privacy > Delete Account. Note that this action is irreversible and all your data will be permanently removed.",
    },
    {
      question: "How do I opt out of marketing emails?",
      answer:
        "Click the 'Unsubscribe' link at the bottom of any marketing email. You can also manage your notification preferences from Account Settings > Notifications.",
    },
  ],
};

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredFaqs = Object.entries(faqs).reduce(
    (acc, [category, items]) => {
      if (selectedCategory && category !== selectedCategory) return acc;
      const filtered = items.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filtered.length > 0) acc[category] = filtered;
      return acc;
    },
    {} as Record<string, { question: string; answer: string }[]>
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="mb-10 text-center">
        <Badge className="mb-3">Help Center</Badge>
        <h1 className="text-4xl font-bold mb-3">How can we help you?</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Search our help center or browse categories below
        </p>
      </div>

      {/* Search */}
      <div className="mx-auto mb-10 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for help topics..."
            className="pl-10 h-12 text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="mb-10 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {helpCategories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() =>
              setSelectedCategory(
                selectedCategory === cat.slug ? null : cat.slug
              )
            }
            className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
              selectedCategory === cat.slug
                ? "border-primary bg-primary/5"
                : "bg-card hover:bg-muted"
            }`}
          >
            <cat.icon
              className={`h-6 w-6 ${
                selectedCategory === cat.slug
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            />
            <span className="text-xs font-medium">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* FAQs */}
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-primary" />
          Frequently Asked Questions
        </h2>

        {Object.keys(filteredFaqs).length === 0 ? (
          <div className="py-12 text-center">
            <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try a different search term or browse all categories.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(filteredFaqs).map(([category, items]) => (
              <div key={category}>
                <h3 className="mb-3 text-lg font-semibold capitalize">
                  {category}
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  {items.map((faq, idx) => (
                    <AccordionItem key={idx} value={`${category}-${idx}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact CTA */}
      <div className="mt-12 rounded-xl bg-primary/5 border border-primary/10 p-8 text-center">
        <MessageSquare className="mx-auto mb-3 h-8 w-8 text-primary" />
        <h2 className="text-xl font-bold mb-2">Still need help?</h2>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          Our support team is available 24/7 to assist you with any questions or
          concerns.
        </p>
        <Button asChild>
          <a href="/contact">Contact Support</a>
        </Button>
      </div>
    </div>
  );
}

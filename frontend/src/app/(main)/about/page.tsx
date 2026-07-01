import { Metadata } from "next";
import {
  Shield,
  Truck,
  Heart,
  Users,
  Target,
  Award,
  MapPin,
  Mail,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about ApnaKit - your trusted online shopping destination. Our mission, values, and our commitment to delivering the best online shopping experience.",
};

const values = [
  {
    icon: Shield,
    title: "Trust & Safety",
    description:
      "Every transaction on ApnaKit is protected with industry-leading security measures.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description:
      "We partner with the best logistics providers to ensure your orders reach you on time.",
  },
  {
    icon: Heart,
    title: "Customer First",
    description:
      "Your satisfaction is our priority. We offer hassle-free returns and 24/7 support.",
  },
  {
    icon: Award,
    title: "Quality Products",
    description:
      "We carefully curate our sellers to ensure you receive only genuine, quality products.",
  },
];

const stats = [
  { label: "Happy Customers", value: "10M+" },
  { label: "Products", value: "50L+" },
  { label: "Sellers", value: "50K+" },
  { label: "Cities Served", value: "1000+" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="mb-16 text-center">
        <h1 className="text-4xl font-bold mb-4">
          About <span className="text-primary">ApnaKit</span>
        </h1>
        <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
          We&apos;re on a mission to make online shopping accessible, affordable,
          and enjoyable for every Indian. Founded in 2024, ApnaKit has grown
          from a small startup to one of India&apos;s most trusted ecommerce
          platforms.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-16 grid grid-cols-2 gap-6 md:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-card p-6 text-center shadow-sm"
          >
            <div className="text-3xl font-bold text-primary">{stat.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Mission & Vision */}
      <div className="mb-16 grid gap-8 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed">
            To empower millions of small and medium businesses across India by
            providing them with a world-class platform to reach customers
            nationwide. We believe every seller deserves a fair chance to grow,
            and every customer deserves access to quality products at great
            prices.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Our Vision</h2>
          <p className="text-muted-foreground leading-relaxed">
            To become India&apos;s most loved and trusted ecommerce platform,
            where every interaction brings joy. We envision a future where
            technology bridges the gap between sellers and buyers, creating
            opportunities and delivering happiness to every doorstep.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Our Values</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <div
              key={value.title}
              className="rounded-xl border bg-card p-6 text-center shadow-sm transition-all hover:shadow-md"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <value.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{value.title}</h3>
              <p className="text-sm text-muted-foreground">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Info */}
      <div className="rounded-xl bg-muted/50 p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Get in Touch
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Address</h3>
              <p className="text-sm text-muted-foreground">
                ApnaKit, Noida, Uttar Pradesh, India - 201301
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Email</h3>
              <a
                href="mailto:support@apnakit.in"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                support@apnakit.in
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

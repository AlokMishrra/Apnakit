"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Award,
  Image,
  Ticket,
  ShoppingCart,
  Users,
  Store,
  RotateCcw,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  X,
  Headphones,
  Truck,
  Zap,
  MapPin,
  Smartphone,
  Share2,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  {
    label: "Products",
    href: "/admin/products",
    icon: Package,
    children: [
      { label: "All Products", href: "/admin/products" },
      { label: "Add Product", href: "/admin/products/new" },
    ],
  },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Brands", href: "/admin/brands", icon: Award },
  { label: "Banners", href: "/admin/banners", icon: Image },
  { label: "App Banner", href: "/admin/app-banner", icon: Smartphone },
  { label: "Social Media", href: "/admin/social-media", icon: Share2 },
  { label: "Contact Messages", href: "/admin/contact-messages", icon: Mail },
  { label: "Coupons", href: "/admin/coupons", icon: Ticket },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Flash Sales", href: "/admin/flash-sales", icon: Zap },
  { label: "Delivery Zones", href: "/admin/delivery-zones", icon: MapPin },
  { label: "Customers", href: "/admin/customers", icon: Users },
  {
    label: "Sellers",
    href: "/admin/sellers",
    icon: Store,
    children: [
      { label: "All Sellers", href: "/admin/sellers" },
      { label: "Add Seller", href: "/admin/sellers/new" },
    ],
  },
  { label: "Returns", href: "/admin/returns", icon: RotateCcw },
  { label: "Support", href: "/admin/support", icon: Headphones },
  {
    label: "Delivery",
    href: "/admin/delivery",
    icon: Truck,
    children: [
      { label: "Add Delivery Person", href: "/admin/delivery/new" },
    ],
  },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-white transition-all duration-300",
          collapsed ? "w-20" : "w-64",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-slate-700/50 px-4",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          {!collapsed && (
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="ApnaKit" className="h-7 w-auto" />
              <span className="text-lg font-bold">Admin</span>
            </Link>
          )}
          {collapsed && (
            <Link href="/admin/dashboard" className="flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="ApnaKit" className="h-8 w-auto" />
            </Link>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-width scrollbar-thumb">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <SidebarItem
                key={item.label}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
                onLinkClick={onClose}
              />
            ))}
          </ul>
        </nav>

        <div
          className={cn(
            "border-t border-slate-700/50 p-4",
            collapsed && "flex justify-center px-2"
          )}
        >
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500/20 text-sm font-semibold text-primary-400">
                A
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">Alok Mishra</p>
                <Badge
                  variant="default"
                  className="mt-0.5 bg-primary-500/20 text-xs text-primary-400 hover:bg-primary-500/20"
                >
                  Super Admin
                </Badge>
              </div>
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500/20 text-sm font-semibold text-primary-400">
              A
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="hidden h-10 border-t border-slate-700/50 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:flex items-center justify-center"
        >
          {collapsed ? (
            <ChevronsRight className="h-5 w-5" />
          ) : (
            <ChevronsLeft className="h-5 w-5" />
          )}
        </button>
      </aside>
    </>
  );
}

function SidebarItem({
  item,
  pathname,
  collapsed,
  onLinkClick,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onLinkClick: () => void;
}) {
  const isActive =
    pathname === item.href ||
    pathname.startsWith(item.href + "/");
  const hasChildren = item.children && item.children.length > 0;

  if (!hasChildren) {
    return (
      <li>
        <Link
          href={item.href}
          onClick={onLinkClick}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isActive
              ? "bg-primary-500/20 text-primary-400"
              : "text-slate-300 hover:bg-slate-800 hover:text-white",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? item.label : undefined}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{item.label}</span>}
        </Link>
      </li>
    );
  }

  return (
    <SidebarDropdown
      item={item}
      pathname={pathname}
      collapsed={collapsed}
      onLinkClick={onLinkClick}
    />
  );
}

function SidebarDropdown({
  item,
  pathname,
  collapsed,
  onLinkClick,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onLinkClick: () => void;
}) {
  const isAnyChildActive = item.children?.some(
    (child) =>
      pathname === child.href ||
      pathname.startsWith(child.href + "/")
  );

  if (collapsed) {
    return (
      <li className="relative group">
        <Link
          href={item.href}
          onClick={onLinkClick}
          className={cn(
            "flex items-center justify-center rounded-lg px-2 py-2.5 text-sm font-medium transition-colors",
            isAnyChildActive
              ? "bg-primary-500/20 text-primary-400"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          )}
          title={item.label}
        >
          <item.icon className="h-5 w-5 shrink-0" />
        </Link>
        <div className="absolute left-full top-0 z-50 ml-2 hidden w-48 rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-xl group-hover:block">
          {item.children?.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={onLinkClick}
              className={cn(
                "block px-4 py-2 text-sm transition-colors",
                pathname === child.href
                  ? "bg-primary-500/20 text-primary-400"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              {child.label}
            </Link>
          ))}
        </div>
      </li>
    );
  }

  return (
    <li>
      <details open={isAnyChildActive}>
        <summary
          className={cn(
            "flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isAnyChildActive
              ? "bg-primary-500/20 text-primary-400"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          )}
        >
          <span className="flex items-center gap-3">
            <item.icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform [[open]>summary>&]:rotate-180" />
        </summary>
        <ul className="mt-1 space-y-0.5 pl-4">
          {item.children?.map((child) => (
            <li key={child.href}>
              <Link
                href={child.href}
                onClick={onLinkClick}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm transition-colors",
                  pathname === child.href
                    ? "bg-primary-500/20 text-primary-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
}

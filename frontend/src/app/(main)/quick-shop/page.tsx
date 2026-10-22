import { HomeSectionSwitch } from "@/components/home/home-section-switch";

export const metadata = {
  title: "Quick & Shop All - ApnaKit",
  description:
    "Quick: items delivered within 24 hours. Shop All: the full catalogue.",
};

/**
 * Dedicated Quick / Shop All page, opened from the bottom navigation.
 * Sections (which products are Quick vs Shop All) are controlled from the
 * admin Home Sections page.
 */
export default function QuickShopPage() {
  return (
    <div className="container mx-auto px-3 py-4">
      <HomeSectionSwitch showToggle />
    </div>
  );
}

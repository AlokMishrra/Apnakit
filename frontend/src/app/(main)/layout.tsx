import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/ui/mobile-nav";
import { LocationGate } from "@/components/layout/location-gate";
import { AppDownloadBanner } from "@/components/layout/app-download-banner";
import { AppDownloadPopup } from "@/components/layout/app-download-popup";
import { DeliveryGate } from "@/components/layout/delivery-gate";
import { PageLoader } from "@/components/ui/page-loader";
import { StoreClosedBanner } from "@/components/layout/store-closed-banner";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LocationGate>
      <PageLoader />
      <AppDownloadPopup />
      <div className="flex min-h-screen flex-col">
        <AppDownloadBanner />
        <StoreClosedBanner />
        <Header />
        <main className="flex-1 pb-16 md:pb-0">
          <DeliveryGate>{children}</DeliveryGate>
        </main>
        <Footer />
        <MobileNav />
      </div>
    </LocationGate>
  );
}

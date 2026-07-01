import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { DatabaseModule } from './config/database.module';
import { RedisModule } from './config/redis.config';
import { RazorpayModule } from './config/razorpay.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BrandsModule } from './modules/brands/brands.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { BannersModule } from './modules/banners/banners.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SearchModule } from './modules/search/search.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { SupportModule } from './modules/support/support.module';
import { UploadModule } from './modules/upload/upload.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SellersModule } from './modules/sellers/sellers.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { FlashSalesModule } from './modules/flash-sales/flash-sales.module';
import { DeliveryZonesModule } from './modules/delivery-zones/delivery-zones.module';
import { AppBannerModule } from './modules/app-banner/app-banner.module';
import { SocialMediaModule } from './modules/social-media/social-media.module';
import { ContactModule } from './modules/contact/contact.module';
import { HealthModule } from './modules/health/health.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    HealthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 60,
    }),
    DatabaseModule,
    RedisModule,
    RazorpayModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    CouponsModule,
    WishlistModule,
    BannersModule,
    ReviewsModule,
    AnalyticsModule,
    SearchModule,
    LoyaltyModule,
    WalletModule,
    SupportModule,
    UploadModule,
    NotificationsModule,
    SellersModule,
    InventoryModule,
    WarehouseModule,
    DeliveryModule,
    FlashSalesModule,
    DeliveryZonesModule,
    AppBannerModule,
    SocialMediaModule,
    ContactModule,
    SettingsModule,
  ],
})
export class AppModule {}

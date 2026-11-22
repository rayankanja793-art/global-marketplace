
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { AdminAuthController } from './admin-auth/admin-auth.controller.js';
import { AdminAuthService } from './admin-auth/admin-auth.service.js';
import { AdminSessionService } from './admin-auth/admin-session.service.js';
import { AdminAuthGuard } from './admin-auth/admin-auth.guard.js';
import { SuperAdminGuard } from './admin-auth/super-admin.guard.js';
import { AdminController } from './admin/admin.controller.js';
import { ProvidersModule } from './providers/providers.module.js';

@Module({
  imports: [
    ProvidersModule,
    DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],
  controllers: [AppController, AdminAuthController, AdminController],
  providers: [
    AppService,
    AdminAuthService,
    AdminSessionService,
    AdminAuthGuard,
    SuperAdminGuard,
  ],
  exports: [
    AdminSessionService,
    AdminAuthGuard,
    SuperAdminGuard,
  ],
})
export class AppModule {}

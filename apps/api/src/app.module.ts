
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseService } from './database/database.service.js';
import { AdminAuthController } from './admin-auth/admin-auth.controller.js';
import { AdminAuthService } from './admin-auth/admin-auth.service.js';
import { AdminSessionService } from './admin-auth/admin-session.service.js';
import { AdminAuthGuard } from './admin-auth/admin-auth.guard.js';
import { AdminController } from './admin/admin.controller.js';

@Module({
  imports: [
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
    DatabaseService,
    AdminAuthService,
    AdminSessionService,
    AdminAuthGuard,
  ],
  exports: [
    DatabaseService,
    AdminSessionService,
    AdminAuthGuard,
  ],
})
export class AppModule {}


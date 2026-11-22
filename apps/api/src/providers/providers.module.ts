import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { AdminSessionService } from '../admin-auth/admin-session.service.js';
import { ProvidersController } from './providers.controller.js';
import { ProvidersService } from './providers.service.js';
import { ProviderSessionService } from './provider-session.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [ProvidersController],
  providers: [ProvidersService, ProviderSessionService, AdminSessionService],
  exports: [ProviderSessionService],
})
export class ProvidersModule {}

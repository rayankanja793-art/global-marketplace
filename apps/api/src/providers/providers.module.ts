import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { ProvidersController } from './providers.controller.js';
import { ProvidersService } from './providers.service.js';
import { ProviderSessionService } from './provider-session.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [ProvidersController],
  providers: [ProvidersService, ProviderSessionService],
  exports: [ProviderSessionService],
})
export class ProvidersModule {}

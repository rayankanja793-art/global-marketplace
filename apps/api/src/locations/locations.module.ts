import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { ProvidersModule } from '../providers/providers.module.js';
import { LocationsController } from './locations.controller.js';
import { LocationsService } from './locations.service.js';

@Module({
  imports: [DatabaseModule, ProvidersModule],
  controllers: [LocationsController],
  providers: [LocationsService],
})
export class LocationsModule {}

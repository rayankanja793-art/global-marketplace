
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard.js';

@Controller('api/admin')
@UseGuards(AdminAuthGuard)
export class AdminController {
  @Get('dashboard')
  getDashboard() {
    return {
      message: 'Administrator access verified.',
      dashboard: 'Global-ServiceMarket',
      status: 'active',
    };
  }
}

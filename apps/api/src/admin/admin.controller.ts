import {
  Body,
  ConflictException,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard.js';
import { SuperAdminGuard } from '../admin-auth/super-admin.guard.js';
import { DatabaseService } from '../database/database.service.js';

type AdminRequest = Request & {
  admin: { id: string; role: string };
};

@Controller('api/admin')
@UseGuards(AdminAuthGuard, SuperAdminGuard)
export class AdminController {
  constructor(private readonly database: DatabaseService) {}

  @Get('dashboard')
  getDashboard() {
    return {
      message: 'Super Administrator access verified.',
      dashboard: 'Global-ServiceMarket',
      status: 'active',
    };
  }

  @Get('dashboard/stats')
  async getDashboardStats() {
    const result = await this.database.query(
      `SELECT COUNT(*)::int AS total_providers
       FROM providers
       WHERE is_active = TRUE`,
    );

    return {
      totalProviders: Number(result.rows[0]?.total_providers ?? 0),
    };
  }
  @Post('providers/link')
  async linkProvider(
    @Body() body: { phone?: string },
    @Req() request: AdminRequest,
  ) {
    const phone = body.phone?.trim();

    if (!phone || !/^\+?[0-9]{7,15}$/.test(phone)) {
      throw new ConflictException('Enter a valid provider phone number.');
    }

    const provider = await this.database.query(
      `SELECT id, full_name, phone
       FROM providers
       WHERE phone = $1 AND is_active = TRUE
       LIMIT 1`,
      [phone],
    );

    if (provider.rows.length === 0) {
      throw new ConflictException('No active provider account matches that phone number.');
    }

    try {
      const linked = await this.database.query(
        `UPDATE providers
         SET linked_admin_id = $1, updated_at = NOW()
         WHERE id = $2
           AND (linked_admin_id IS NULL OR linked_admin_id = $1)
         RETURNING id, full_name, phone`,
        [request.admin.id, provider.rows[0].id],
      );

      if (linked.rows.length === 0) {
        throw new ConflictException('This provider is already linked to another administrator.');
      }

      return {
        success: true,
        message: 'Provider linked to the existing Super Administrator.',
        provider: linked.rows[0],
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;

      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException('This Super Administrator is already linked to another provider.');
      }

      throw error;
    }
  }
}

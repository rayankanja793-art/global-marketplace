import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import type { Response } from 'express';
import { DatabaseService } from '../database/database.service.js';

const COOKIE_NAME = 'gsm_provider_session';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

@Injectable()
export class ProviderSessionService {
  constructor(
    private readonly database: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: this.config.get('NODE_ENV') === 'production' ? 'none' as const : 'lax' as const,
      path: '/providers',
      maxAge: SESSION_DURATION_MS,
    };
  }

  async createSession(providerId: string, response: Response): Promise<void> {
    const token = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await this.database.query(
      `INSERT INTO provider_sessions (provider_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [providerId, tokenHash, expiresAt],
    );

    response.cookie(COOKIE_NAME, token, this.cookieOptions());
  }

  async validateSession(token?: string) {
    if (!token || token.length > 100) {
      throw new UnauthorizedException('Provider session required.');
    }

    const result = await this.database.query(
      `SELECT p.id, p.account_type, p.full_name, p.business_name,
              p.email, p.phone, p.county, p.town, p.is_verified,
              EXISTS (
                SELECT 1
                FROM administrators a
                WHERE a.id = p.linked_admin_id
                  AND a.role = 'super_admin'
                  AND a.is_active = TRUE
              ) AS has_admin_access
       FROM provider_sessions s
       JOIN providers p ON p.id = s.provider_id
       WHERE s.token_hash = $1
         AND s.expires_at > NOW()
         AND p.is_active = TRUE
       LIMIT 1`,
      [this.hashToken(token)],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('Provider session expired.');
    }

    return result.rows[0];
  }

  async destroySession(token: string | undefined, response: Response) {
    if (token && token.length <= 100) {
      await this.database.query(
        'DELETE FROM provider_sessions WHERE token_hash = $1',
        [this.hashToken(token)],
      );
    }

    response.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: this.config.get('NODE_ENV') === 'production' ? 'none' : 'lax',
      path: '/providers',
    });

    return { message: 'Provider session ended.' };
  }
}

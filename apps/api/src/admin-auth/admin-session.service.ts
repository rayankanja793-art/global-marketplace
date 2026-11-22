
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import type { Response } from 'express';
import { DatabaseService } from '../database/database.service.js';

const COOKIE_NAME = 'gsm_admin_session';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

@Injectable()
export class AdminSessionService {
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
     sameSite: 'none' as const,
      path: '/api/admin',
      maxAge: SESSION_DURATION_MS,
    };
  }

  async createSession(adminId: string, response: Response): Promise<void> {
    const token = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await this.database.query(
      `INSERT INTO admin_sessions (admin_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [adminId, tokenHash, expiresAt],
    );

    response.cookie(COOKIE_NAME, token, this.cookieOptions());
  }

  async validateSession(token?: string) {
    if (!token || token.length > 100) {
      throw new UnauthorizedException('Administrator session required.');
    }

    const tokenHash = this.hashToken(token);

    const result = await this.database.query(
      `SELECT a.id, a.email, a.full_name, a.role
       FROM admin_sessions s
       JOIN administrators a ON a.id = s.admin_id
       WHERE s.token_hash = $1
         AND s.expires_at > NOW()
         AND a.is_active = TRUE
       LIMIT 1`,
      [tokenHash],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('Administrator session expired.');
    }

    return {
      id: result.rows[0].id,
      email: result.rows[0].email,
      fullName: result.rows[0].full_name,
      role: result.rows[0].role,
    };
  }

  async destroySession(token: string | undefined, response: Response) {
    if (token && token.length <= 100) {
      await this.database.query(
        'DELETE FROM admin_sessions WHERE token_hash = $1',
        [this.hashToken(token)],
      );
    }

    response.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: '/api/admin',
    });

    return { message: 'Administrator session ended.' };
  }
}

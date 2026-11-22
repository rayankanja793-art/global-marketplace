import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import type { Response } from 'express';
import { DatabaseService } from '../database/database.service.js';
import { ProviderSessionService } from './provider-session.service.js';

const scrypt = promisify(scryptCallback);

@Injectable()
export class ProvidersService {
  constructor(
    private readonly database: DatabaseService,
    private readonly sessions: ProviderSessionService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  private async verifyPassword(
    password: string,
    storedHash: string,
  ): Promise<boolean> {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;

    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    const storedKey = Buffer.from(key, 'hex');

    return storedKey.length === derivedKey.length &&
      timingSafeEqual(storedKey, derivedKey);
  }

  async register(input: {
    accountType: 'individual' | 'business';
    fullName: string;
    businessName?: string;
    email?: string;
    phone: string;
    password: string;
    county?: string;
    town?: string;
  }) {
    const phone = input.phone.trim();
    const email = input.email?.trim().toLowerCase() || null;

    const existing = await this.database.query(
      `SELECT id FROM providers
       WHERE phone = $1 OR ($2::text IS NOT NULL AND email = $2)
       LIMIT 1`,
      [phone, email],
    );

    if (existing.rows.length > 0) {
      throw new ConflictException(
        'An account with this phone number or email already exists.',
      );
    }

    const passwordHash = await this.hashPassword(input.password);

    const result = await this.database.query(
      `INSERT INTO providers (
        account_type, full_name, business_name, email, phone,
        password_hash, county, town
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, account_type, full_name, business_name,
                email, phone, county, town, is_verified, created_at`,
      [
        input.accountType,
        input.fullName.trim(),
        input.businessName?.trim() || null,
        email,
        phone,
        passwordHash,
        input.county?.trim() || null,
        input.town?.trim() || null,
      ],
    );

    return {
      success: true,
      message: 'Provider account created successfully.',
      provider: result.rows[0],
    };
  }

  async login(phone: string, password: string, response: Response) {
    const result = await this.database.query(
      `SELECT id, account_type, full_name, business_name,
              email, phone, password_hash, is_active, is_verified
       FROM providers
       WHERE phone = $1
       LIMIT 1`,
      [phone.trim()],
    );

    const provider = result.rows[0];

    if (
      !provider ||
      !provider.is_active ||
      !(await this.verifyPassword(password, provider.password_hash))
    ) {
      throw new UnauthorizedException('Invalid phone number or password.');
    }

    await this.sessions.createSession(provider.id, response);

    const {
      password_hash: _passwordHash,
      ...safeProvider
    } = provider;

    return {
      success: true,
      message: 'Provider login successful.',
      provider: safeProvider,
    };
  }
}


import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createHash,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from 'node:crypto';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');

    const hash = await new Promise<Buffer>((resolve, reject) => {
      scrypt(
        password,
        salt,
        64,
        { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
        (error, derivedKey) => {
          if (error) reject(error);
          else resolve(derivedKey);
        },
      );
    });

    return `scrypt$16384$8$1$${salt}$${hash.toString('hex')}`;
  }

  private async verifyPassword(
    password: string,
    storedHash: string,
  ): Promise<boolean> {
    const [algorithm, n, r, p, salt, originalHash] = storedHash.split('$');

    if (
      algorithm !== 'scrypt' ||
      n !== '16384' ||
      r !== '8' ||
      p !== '1' ||
      !salt ||
      !originalHash ||
      !/^[a-f0-9]{128}$/i.test(originalHash)
    ) {
      return false;
    }

    const calculated = await new Promise<Buffer>((resolve, reject) => {
      scrypt(
        password,
        salt,
        64,
        { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
        (error, derivedKey) => {
          if (error) reject(error);
          else resolve(derivedKey);
        },
      );
    });

    return timingSafeEqual(calculated, Buffer.from(originalHash, 'hex'));
  }

  private verifyBootstrapSecret(provided: string): boolean {
    const expected = this.config.get<string>('ADMIN_BOOTSTRAP_SECRET');

    if (!expected || !provided) return false;

    const expectedHash = createHash('sha256').update(expected).digest();
    const providedHash = createHash('sha256').update(provided).digest();

    return timingSafeEqual(expectedHash, providedHash);
  }

  async createFirstSuperAdmin(
    fullName: string,
    email: string,
    password: string,
    bootstrapSecret: string,
  ) {
    if (!this.verifyBootstrapSecret(bootstrapSecret)) {
      throw new UnauthorizedException('Invalid registration authorization.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (
      !fullName.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      password.length < 12
    ) {
      throw new UnauthorizedException('Invalid administrator details.');
    }

    const existing = await this.database.query(
      'SELECT id FROM administrators WHERE role = $1 LIMIT 1',
      ['super_admin'],
    );

    if (existing.rows.length > 0) {
      throw new ConflictException('Initial administrator already exists.');
    }

    const passwordHash = await this.hashPassword(password);

    const result = await this.database.query(
      `INSERT INTO administrators
       (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, 'super_admin')
       RETURNING id, email, full_name, role`,
      [normalizedEmail, passwordHash, fullName.trim()],
    );

    return result.rows[0];
  }

  async verifyAdminLogin(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const result = await this.database.query(
      `SELECT id, email, full_name, role, password_hash, is_active
       FROM administrators
       WHERE email = $1
       LIMIT 1`,
      [normalizedEmail],
    );

    const admin = result.rows[0];

    if (
      !admin ||
      !admin.is_active ||
      !(await this.verifyPassword(password, admin.password_hash))
    ) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    await this.database.query(
      'UPDATE administrators SET last_login_at = NOW() WHERE id = $1',
      [admin.id],
    );

    return {
      id: admin.id,
      email: admin.email,
      fullName: admin.full_name,
      role: admin.role,
    };
  }
}

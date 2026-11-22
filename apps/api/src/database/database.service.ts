
import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const connectionString = this.configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured.');
    }

    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.pool.query('SELECT 1');

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS administrators (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin'
          CHECK (role IN (
            'super_admin',
            'admin',
            'support',
            'finance',
            'provider_manager'
          )),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_login_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS administrators_role_idx
      ON administrators(role);
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id UUID NOT NULL REFERENCES administrators(id) ON DELETE CASCADE,
        token_hash CHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS admin_sessions_admin_id_idx
      ON admin_sessions(admin_id);
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS admin_sessions_expires_at_idx
      ON admin_sessions(expires_at);
    `);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    values: unknown[] = [],
  ): Promise<QueryResult<T>> {
    try {
      return await this.pool.query<T>(sql, values);
    } catch {
      throw new ServiceUnavailableException(
        'The database operation could not be completed.',
      );
    }
  }
}

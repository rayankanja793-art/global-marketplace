import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type {
  CreateProviderLocationDto,
} from './location.dto.js';

@Injectable()
export class LocationsService {
  constructor(private readonly database: DatabaseService) {}

  async getProviderLocations(providerId: string) {
    const result = await this.database.query(
      `SELECT
         id,
         address_label AS "addressLabel",
         county,
         town,
         country_code AS "countryCode",
         ST_Y(coordinates::geometry) AS latitude,
         ST_X(coordinates::geometry) AS longitude,
         is_primary AS "isPrimary",
         created_at AS "createdAt",
         updated_at AS "updatedAt"
       FROM provider_locations
       WHERE provider_id = $1
       ORDER BY is_primary DESC, created_at ASC`,
      [providerId],
    );

    return result.rows;
  }

  async saveProviderLocation(
    providerId: string,
    dto: CreateProviderLocationDto,
  ) {
    return this.database.transaction(async (client) => {
      const provider = await client.query(
        'SELECT id FROM providers WHERE id = $1 AND is_active = TRUE FOR UPDATE',
        [providerId],
      );

      if (provider.rowCount === 0) {
        throw new NotFoundException('Provider account not found.');
      }

      const existing = await client.query(
        'SELECT id FROM provider_locations WHERE provider_id = $1 LIMIT 1',
        [providerId],
      );

      const makePrimary = dto.isPrimary || existing.rowCount === 0;

      if (makePrimary) {
        await client.query(
          'UPDATE provider_locations SET is_primary = FALSE WHERE provider_id = $1',
          [providerId],
        );
      }

      const result = await client.query(
        `INSERT INTO provider_locations (
           provider_id,
           address_label,
           county,
           town,
           country_code,
           coordinates,
           is_primary
         )
         VALUES (
           $1, $2, $3, $4, $5,
           ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography,
           $8
         )
         RETURNING
           id,
           address_label AS "addressLabel",
           county,
           town,
           country_code AS "countryCode",
           ST_Y(coordinates::geometry) AS latitude,
           ST_X(coordinates::geometry) AS longitude,
           is_primary AS "isPrimary",
           created_at AS "createdAt"`,
        [
          providerId,
          dto.addressLabel,
          dto.county ?? null,
          dto.town ?? null,
          dto.countryCode,
          dto.longitude,
          dto.latitude,
          makePrimary,
        ],
      );

      return result.rows[0];
    });
  }

  async setPrimaryLocation(providerId: string, locationId: string) {
    return this.database.transaction(async (client) => {
      const provider = await client.query(
        'SELECT id FROM providers WHERE id = $1 AND is_active = TRUE FOR UPDATE',
        [providerId],
      );

      if (provider.rowCount === 0) {
        throw new NotFoundException('Provider account not found.');
      }

      const location = await client.query(
        'SELECT id FROM provider_locations WHERE id = $1 AND provider_id = $2',
        [locationId, providerId],
      );

      if (location.rowCount === 0) {
        throw new NotFoundException('Provider location not found.');
      }

      await client.query(
        'UPDATE provider_locations SET is_primary = FALSE WHERE provider_id = $1',
        [providerId],
      );

      const result = await client.query(
        `UPDATE provider_locations
         SET is_primary = TRUE, updated_at = NOW()
         WHERE id = $1 AND provider_id = $2
         RETURNING id, address_label AS "addressLabel", is_primary AS "isPrimary"`,
        [locationId, providerId],
      );

      return result.rows[0];
    });
  }
}

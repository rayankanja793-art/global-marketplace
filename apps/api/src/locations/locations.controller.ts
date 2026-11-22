import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Body,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { ProviderSessionService } from '../providers/provider-session.service.js';
import { CreateProviderLocationDto } from './location.dto.js';
import { LocationsService } from './locations.service.js';

const COOKIE_NAME = 'gsm_provider_session';

function getSessionToken(request: Request): string | undefined {
  const cookies = request.headers.cookie ?? '';

  const sessionCookie = cookies
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));

  return sessionCookie
    ? decodeURIComponent(sessionCookie.slice(COOKIE_NAME.length + 1))
    : undefined;
}

@Controller('providers/locations')
export class LocationsController {
  constructor(
    private readonly locations: LocationsService,
    private readonly sessions: ProviderSessionService,
    private readonly config: ConfigService,
  ) {}

  private assertTrustedOrigin(request: Request): void {
    const configuredOrigin =
      this.config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3000';

    let expectedOrigin: string;

    try {
      expectedOrigin = new URL(configuredOrigin).origin;
    } catch {
      throw new ForbiddenException('The trusted website origin is not configured correctly.');
    }

    if (request.headers.origin !== expectedOrigin) {
      throw new ForbiddenException('Request origin is not allowed.');
    }
  }

  private async getAuthenticatedProvider(request: Request) {
    const token = getSessionToken(request);

    if (!token) {
      throw new UnauthorizedException('Provider session required.');
    }

    return this.sessions.validateSession(token);
  }

  @Get()
  async getLocations(@Req() request: Request) {
    const provider = await this.getAuthenticatedProvider(request);
    return this.locations.getProviderLocations(provider.id);
  }

  @Post()
  async createLocation(
    @Req() request: Request,
    @Body() body: CreateProviderLocationDto,
  ) {
    this.assertTrustedOrigin(request);
    const provider = await this.getAuthenticatedProvider(request);

    return this.locations.saveProviderLocation(provider.id, body);
  }

  @Patch(':locationId/primary')
  async setPrimaryLocation(
    @Req() request: Request,
    @Param('locationId', new ParseUUIDPipe()) locationId: string,
  ) {
    this.assertTrustedOrigin(request);
    const provider = await this.getAuthenticatedProvider(request);

    return this.locations.setPrimaryLocation(provider.id, locationId);
  }
}

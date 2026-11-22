CREATE TABLE IF NOT EXISTS provider_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  address_label TEXT NOT NULL,
  county TEXT,
  town TEXT,
  country_code CHAR(2) NOT NULL DEFAULT 'KE',
  coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS provider_locations_provider_id_idx
  ON provider_locations(provider_id);

CREATE INDEX IF NOT EXISTS provider_locations_coordinates_gist_idx
  ON provider_locations USING GIST(coordinates);

CREATE UNIQUE INDEX IF NOT EXISTS provider_locations_one_primary_idx
  ON provider_locations(provider_id)
  WHERE is_primary = TRUE;


CREATE TABLE IF NOT EXISTS provider_service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  area_name TEXT NOT NULL,
  boundary GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT provider_service_areas_valid_boundary
    CHECK (ST_IsValid(boundary) AND NOT ST_IsEmpty(boundary))
);

CREATE INDEX IF NOT EXISTS provider_service_areas_provider_id_idx
  ON provider_service_areas(provider_id);

CREATE INDEX IF NOT EXISTS provider_service_areas_boundary_gist_idx
  ON provider_service_areas USING GIST(boundary);


CREATE TABLE IF NOT EXISTS location_search_cache (
  cache_key TEXT PRIMARY KEY,
  service TEXT NOT NULL,
  response JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS location_search_cache_expires_at_idx
  ON location_search_cache(expires_at);


CREATE TABLE IF NOT EXISTS location_service_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  service TEXT NOT NULL,
  action TEXT NOT NULL,
  outcome TEXT NOT NULL
    CHECK (outcome IN ('success', 'failure', 'limited')),
  credits_used INTEGER NOT NULL DEFAULT 0
    CHECK (credits_used >= 0),
  request_hash CHAR(64),
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS location_service_logs_provider_id_idx
  ON location_service_logs(provider_id);

CREATE INDEX IF NOT EXISTS location_service_logs_created_at_idx
  ON location_service_logs(created_at);

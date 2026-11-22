"use client";

import { useEffect, useRef } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

export interface MapLocation {
  id: string;
  addressLabel: string;
  latitude: number;
  longitude: number;
  isPrimary: boolean;
}

interface ProviderLocationMapProps {
  locations: MapLocation[];
  onLocationSelect: (latitude: number, longitude: number) => void;
}

export default function ProviderLocationMap({
  locations,
  onLocationSelect,
}: ProviderLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const selectedMarkerRef = useRef<import("maplibre-gl").Marker | null>(null);
  const callbackRef = useRef(onLocationSelect);

  useEffect(() => {
    callbackRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | null = null;

    async function initializeMap() {
      const maplibregl = await import("maplibre-gl");
      maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");

      if (cancelled || !containerRef.current) return;

      const primary = locations.find((location) => location.isPrimary);
      const initial = primary || locations[0];

      map = new maplibregl.Map({
        container: containerRef.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: initial
          ? [initial.longitude, initial.latitude]
          : [36.8219, -1.2921],
        zoom: initial ? 13 : 5,
      });

      mapRef.current = map;

      map.addControl(new maplibregl.NavigationControl(), "top-right");

      map.on("load", () => {
        if (cancelled || !map) return;

        locations.forEach((location) => {
          new maplibregl.Marker({
            color: location.isPrimary ? "#16a34a" : "#2563eb",
          })
            .setLngLat([location.longitude, location.latitude])
            .setPopup(
              new maplibregl.Popup({ offset: 25 }).setText(
                `${location.addressLabel}${location.isPrimary ? " (Primary)" : ""}`
              )
            )
            .addTo(map!);
        });
      });

      map.on("click", (event) => {
        if (!map) return;

        const { lng, lat } = event.lngLat;

        selectedMarkerRef.current?.remove();

        selectedMarkerRef.current = new maplibregl.Marker({
          color: "#dc2626",
          draggable: true,
        })
          .setLngLat([lng, lat])
          .addTo(map);

        selectedMarkerRef.current.on("dragend", () => {
          const position = selectedMarkerRef.current?.getLngLat();
          if (position) callbackRef.current(position.lat, position.lng);
        });

        callbackRef.current(lat, lng);
      });
    }

    initializeMap();

    return () => {
      cancelled = true;
      selectedMarkerRef.current?.remove();
      selectedMarkerRef.current = null;
      map?.remove();
      mapRef.current = null;
    };
  }, [locations]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="h-[380px] w-full overflow-hidden rounded-xl border border-slate-300 bg-slate-100"
        aria-label="Interactive provider location map"
      />
      <p className="text-xs text-slate-500">
        Green pins show your primary location, blue pins show other saved
        locations. Click the map to select a position; drag the red pin to
        adjust it.
      </p>
    </div>
  );
}
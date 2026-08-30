"use client";

import dynamic from "next/dynamic";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

import type { MapConfiguration } from "@/config/map";
import { FallbackMapSurface } from "@/features/travel/map/fallback-map-surface";
import type { MapSurfaceProps } from "@/features/travel/map/map-surface-types";

const MapLibreMapSurface = dynamic(
  () => import("@/features/travel/map/maplibre-map-surface").then((module) => module.MapLibreMapSurface),
  { ssr: false, loading: () => null },
);

interface GeographicMapProps extends MapSurfaceProps {
  readonly configuration: MapConfiguration;
}

export function GeographicMap(props: GeographicMapProps) {
  const { activeTravelRoute, configuration, onTravelComplete } = props;
  const [mapLibreReady, setMapLibreReady] = useState(false);
  const [providerFailed, setProviderFailed] = useState(false);
  const activeTravelRouteRef = useRef(activeTravelRoute);

  useLayoutEffect(() => {
    activeTravelRouteRef.current = activeTravelRoute;
  }, [activeTravelRoute]);

  const handleMapLibreReady = useCallback(() => {
    if (activeTravelRouteRef.current) return;
    setMapLibreReady(true);
  }, []);
  const handleMapLibreError = useCallback(() => setProviderFailed(true), []);
  const handleTravelComplete = useCallback((routeId: string) => {
    onTravelComplete(routeId);
  }, [onTravelComplete]);

  if (providerFailed) {
    return <FallbackMapSurface {...props} reason="provider_error" onTravelComplete={handleTravelComplete} />;
  }

  const showMapLibre = mapLibreReady;

  return (
    <div className="map-provider-stack">
      {!showMapLibre ? (
        <FallbackMapSurface
          {...props}
          activeTravelRoute={activeTravelRoute}
          reason="provider_loading"
          onTravelComplete={handleTravelComplete}
        />
      ) : null}
      <div className="vector-surface-slot" data-visible={showMapLibre} aria-hidden={!showMapLibre} inert={!showMapLibre}>
        <MapLibreMapSurface
          {...props}
          activeTravelRoute={showMapLibre ? activeTravelRoute : null}
          styleUrl={configuration.styleUrl}
          onProviderError={handleMapLibreError}
          onReady={handleMapLibreReady}
          onTravelComplete={handleTravelComplete}
        />
      </div>
    </div>
  );
}

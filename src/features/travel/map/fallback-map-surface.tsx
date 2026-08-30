"use client";

import type { CSSProperties, MouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { getWorldNodePresentationPriority } from "@/application/travel/select-world-network-nodes";
import type { GeographicPoint } from "@/domain/travel/types";
import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";
import { resolveMapLabelPlacements, type MapLabelPlacement } from "@/features/travel/map/label-collision";
import {
  projectFallbackWorldPoint,
  resolveNearestMarkerId,
  resolveNonOverlappingHitDiameters,
  shouldShowPersistentWorldLabel,
} from "@/features/travel/map/marker-interaction";
import type { MapSurfaceProps } from "@/features/travel/map/map-surface-types";

type FallbackReason = "provider_error" | "provider_loading";

interface FallbackMapSurfaceProps extends MapSurfaceProps {
  readonly reason: FallbackReason;
}

function pointStyle(inline: number, block: number, hitDiameter?: number) {
  return {
    "--node-inline": `${inline}%`,
    "--node-block": `${block}%`,
    ...(hitDiameter !== undefined ? { "--marker-hit-size": `${hitDiameter}px` } : {}),
  } as CSSProperties;
}

function routePath(origin: GeographicPoint, destination: GeographicPoint) {
  const start = projectFallbackWorldPoint(origin);
  const end = projectFallbackWorldPoint(destination);
  const controlX = (start.inline + end.inline) / 2;
  const controlY = Math.max(10, Math.min(start.block, end.block) - 14);
  return `M ${start.inline} ${start.block} Q ${controlX} ${controlY} ${end.inline} ${end.block}`;
}

function placementClass(placement: MapLabelPlacement | undefined) {
  return placement ? ` label-anchor-${placement.anchor}` : "";
}

export function FallbackMapSurface({
  activeTravelRoute,
  worldNodes,
  hotspots,
  level,
  reason,
  reduceMotion,
  selectedDestinationId,
  selectedHotspotId,
  showRouteArc,
  onDestinationSelect,
  onHotspotSelect,
  onTravelComplete,
}: FallbackMapSurfaceProps) {
  const { locale, t } = useUiPreferences();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 390, height: 640 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const next = { width: container.clientWidth, height: container.clientHeight };
      setSize((current) => current.width === next.width && current.height === next.height ? current : next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!activeTravelRoute) return;

    const duration = reason === "provider_error"
      ? Math.min(activeTravelRoute.reducedMotionDurationMs, 550)
      : reduceMotion
        ? activeTravelRoute.reducedMotionDurationMs
        : activeTravelRoute.durationMs;
    const timeout = window.setTimeout(
      () => onTravelComplete(activeTravelRoute.id),
      duration,
    );

    return () => window.clearTimeout(timeout);
  }, [activeTravelRoute, onTravelComplete, reason, reduceMotion]);

  const worldPlacements = useMemo(() => {
    const candidates = worldNodes.map((node) => {
      const point = projectFallbackWorldPoint(node.coordinates);
      return {
        id: node.id,
        x: size.width * point.inline / 100,
        y: size.height * point.block / 100,
        labelLength: node.name.en.length + node.name.ar.length * 0.55,
        priority: getWorldNodePresentationPriority(node, selectedDestinationId),
        selected: node.id === selectedDestinationId,
      };
    });
    return new Map(resolveMapLabelPlacements(candidates, {
      width: size.width,
      height: size.height,
      maxLabels: size.width < 640 ? 0 : 2,
      insets: {
        top: size.width < 700 ? 112 : 90,
        right: 18,
        bottom: size.width < 1024 && selectedDestinationId ? Math.min(230, size.height * 0.38) : 32,
        left: 18,
      },
    }).map((placement) => [placement.id, placement]));
  }, [selectedDestinationId, size.height, size.width, worldNodes]);

  const worldScreenMarkers = useMemo(() => worldNodes.map((node) => {
    const point = projectFallbackWorldPoint(node.coordinates);
    return {
      id: node.id,
      x: size.width * point.inline / 100,
      y: size.height * point.block / 100,
    };
  }), [size.height, size.width, worldNodes]);
  const worldHitDiameters = useMemo(
    () => resolveNonOverlappingHitDiameters(worldScreenMarkers),
    [worldScreenMarkers],
  );

  function selectNearestWorldMarker(event: MouseEvent<HTMLDivElement>) {
    if (event.detail === 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const markerId = resolveNearestMarkerId(worldScreenMarkers, {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
    if (!markerId) return;
    event.preventDefault();
    event.stopPropagation();
    onDestinationSelect(markerId);
  }

  const hotspotPlacements = useMemo(() => {
    const candidates = hotspots.map((hotspot) => ({
      id: hotspot.id,
      x: size.width * hotspot.fallbackPosition.inline / 100,
      y: size.height * hotspot.fallbackPosition.block / 100,
      labelLength: hotspot.name.en.length + hotspot.name.ar.length * 0.55,
      priority: hotspot.id === selectedHotspotId
        ? 2_000
        : hotspot.availability === "available" ? 850 : hotspot.availability === "preview" ? 520 : 400,
      selected: hotspot.id === selectedHotspotId,
    }));
    return new Map(resolveMapLabelPlacements(candidates, {
      width: size.width,
      height: size.height,
      maxLabels: size.width < 520 ? 2 : size.width < 900 ? 3 : 5,
      insets: {
        top: size.width < 700 ? 112 : 90,
        right: 20,
        bottom: size.width < 1024 && selectedHotspotId ? Math.min(220, size.height * 0.36) : 34,
        left: 20,
      },
    }).map((placement) => [placement.id, placement]));
  }, [hotspots, selectedHotspotId, size.height, size.width]);

  return (
    <div
      ref={containerRef}
      className={`fallback-map fallback-map-${level}${activeTravelRoute ? " is-travelling" : ""}`}
      role="region"
      aria-label={t(level === "world" ? "map.worldAria" : "map.cityAria")}
    >
      <div className="fallback-atmosphere" aria-hidden="true" />

      {level === "world" ? (
        <>
          <div className="fallback-land fallback-land-africa" aria-hidden="true" />
          <div className="fallback-land fallback-land-arabia" aria-hidden="true" />
          <div className="fallback-land fallback-land-levant" aria-hidden="true" />

          {showRouteArc && activeTravelRoute ? (
            <svg className="fallback-route" viewBox="0 0 100 70" preserveAspectRatio="none" aria-hidden="true">
              <path d={routePath(activeTravelRoute.from.center, activeTravelRoute.to.center)} pathLength="1" />
            </svg>
          ) : null}

          <div className="world-node-layer" onClickCapture={selectNearestWorldMarker}>
            {worldNodes.map((node) => {
              const point = projectFallbackWorldPoint(node.coordinates);
              const selected = node.id === selectedDestinationId;
              const placement = worldPlacements.get(node.id);
              const statusKey = node.availability === "available"
                ? "map.nodeAria.available"
                : node.availability === "preview"
                  ? "map.nodeAria.preview"
                  : "map.nodeAria.comingSoon";
              return (
                <button
                  key={node.id}
                  type="button"
                  className={`geo-node world-map-node focus-ring is-${node.availability}${placementClass(placement)}${selected ? " is-selected" : ""}`}
                  style={pointStyle(point.inline, point.block, worldHitDiameters.get(node.id))}
                  data-label-visible={Boolean(
                    placement?.visible && shouldShowPersistentWorldLabel(node.id, selectedDestinationId, size.width),
                  )}
                  data-node-id={node.id}
                  aria-label={t(statusKey, { name: node.name[locale] })}
                  aria-pressed={selected}
                  onClick={() => onDestinationSelect(node.id)}
                >
                  <span className="geo-node-pulse" aria-hidden="true" />
                  <span className="geo-node-label" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
                    {node.name[locale]}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="city-grid" aria-hidden="true" />
          <div className="city-water" aria-hidden="true" />
          <div className="city-blocks" aria-hidden="true">
            {Array.from({ length: 18 }, (_, index) => <span key={index} />)}
          </div>
          <div className="hotspot-node-layer">
            {hotspots.map((hotspot) => {
              const selected = hotspot.id === selectedHotspotId;
              const placement = hotspotPlacements.get(hotspot.id);
              const statusKey = hotspot.availability === "available"
                ? "map.nodeAria.available"
                : hotspot.availability === "preview"
                  ? "map.nodeAria.preview"
                  : "map.nodeAria.comingSoon";
              return (
                <button
                  key={hotspot.id}
                  type="button"
                  className={`geo-node hotspot-node focus-ring is-${hotspot.availability}${placementClass(placement)}${selected ? " is-selected" : ""}`}
                  style={pointStyle(hotspot.fallbackPosition.inline, hotspot.fallbackPosition.block)}
                  data-label-visible={placement?.visible ?? false}
                  aria-label={t(statusKey, { name: hotspot.name[locale] })}
                  aria-pressed={selected}
                  onClick={() => onHotspotSelect(hotspot.id)}
                >
                  <span className="geo-node-pulse" aria-hidden="true" />
                  <span className="geo-node-label" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
                    {hotspot.name[locale]}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <span className="fallback-map-caption" aria-hidden="true">
        {t(level === "world" ? "map.caption.world" : "map.caption.city")}
      </span>
    </div>
  );
}

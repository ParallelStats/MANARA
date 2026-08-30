"use client";

import * as maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

import { createGeographicArc } from "@/application/travel/create-geographic-arc";
import { getWorldNodePresentationPriority } from "@/application/travel/select-world-network-nodes";
import type { LocalizedText } from "@/domain/content/types";
import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";
import { resolveMapLabelPlacements } from "@/features/travel/map/label-collision";
import { resolveNearestMarkerId } from "@/features/travel/map/marker-interaction";
import type { MapSurfaceProps } from "@/features/travel/map/map-surface-types";
import type { UiLocale } from "@/i18n/ui-preferences";

interface MapLibreMapSurfaceProps extends MapSurfaceProps {
  readonly styleUrl: string;
  readonly onProviderError: () => void;
  readonly onReady: () => void;
}

const worldSourceId = "manara-world-destinations";
const routeSourceId = "manara-travel-route";

function applyManaraMapPalette(map: maplibregl.Map) {
  for (const layer of map.getStyle().layers ?? []) {
    const sourceLayer = (layer as { "source-layer"?: string })["source-layer"];
    const id = layer.id.toLowerCase();
    const isCountryLabel = id.includes("country");
    const isProviderPlaceLabel = sourceLayer === "place" && !isCountryLabel;
    const isProviderPoi = sourceLayer === "poi" || /(^|[-_])poi([-_]|$)/i.test(id);

    if (layer.type === "symbol" && (isProviderPlaceLabel || isProviderPoi)) {
      map.setLayoutProperty(layer.id, "visibility", "none");
      continue;
    }

    if (layer.type === "background") {
      map.setPaintProperty(layer.id, "background-color", "#102019");
      continue;
    }

    if (layer.type === "raster") {
      map.setPaintProperty(layer.id, "raster-opacity", 0.32);
      map.setPaintProperty(layer.id, "raster-saturation", -0.7);
      map.setPaintProperty(layer.id, "raster-contrast", 0.18);
      map.setPaintProperty(layer.id, "raster-brightness-min", 0.04);
      map.setPaintProperty(layer.id, "raster-brightness-max", 0.36);
      continue;
    }

    if (layer.type === "fill") {
      if (sourceLayer === "water") {
        map.setPaintProperty(layer.id, "fill-color", "#123d48");
        map.setPaintProperty(layer.id, "fill-opacity", 0.94);
      } else if (sourceLayer === "building") {
        map.setPaintProperty(layer.id, "fill-color", "#2c352f");
        map.setPaintProperty(layer.id, "fill-opacity", 0.82);
      } else if (id.includes("park") || id.includes("wood") || id.includes("grass")) {
        map.setPaintProperty(layer.id, "fill-color", "#274a36");
        map.setPaintProperty(layer.id, "fill-opacity", 0.76);
      } else if (id.includes("sand")) {
        map.setPaintProperty(layer.id, "fill-color", "#5d4b32");
        map.setPaintProperty(layer.id, "fill-opacity", 0.72);
      } else if (sourceLayer === "landuse" || sourceLayer === "landcover") {
        map.setPaintProperty(layer.id, "fill-color", "#20372b");
        map.setPaintProperty(layer.id, "fill-opacity", 0.56);
      }
      continue;
    }

    if (layer.type === "line") {
      if (sourceLayer === "boundary" || id.includes("boundary")) {
        map.setPaintProperty(layer.id, "line-color", "#d6bd79");
        map.setPaintProperty(layer.id, "line-opacity", id.includes("country") || id.includes("boundary_2") ? 0.82 : 0.4);
      } else if (sourceLayer === "transportation") {
        const majorRoad = /(motorway|trunk|primary|secondary)/.test(id);
        map.setPaintProperty(layer.id, "line-color", majorRoad ? "#a98d58" : "#655c49");
        map.setPaintProperty(layer.id, "line-opacity", majorRoad ? 0.82 : 0.58);
      }
      continue;
    }

    if (layer.type === "symbol" && sourceLayer === "place" && isCountryLabel) {
      map.setPaintProperty(layer.id, "text-color", "#ead8a4");
      map.setPaintProperty(layer.id, "text-halo-color", "#07110e");
      map.setPaintProperty(layer.id, "text-halo-width", 1.4);
    } else if (layer.type === "symbol" && sourceLayer === "water_name") {
      map.setPaintProperty(layer.id, "text-color", "#8fbfca");
      map.setPaintProperty(layer.id, "text-halo-color", "#07110e");
    }
  }
}

function asLngLat(point: readonly [number, number]): [number, number] {
  return [point[0], point[1]];
}

function createMarkerButton(
  name: LocalizedText,
  status: string,
  selected: boolean,
  locale: UiLocale,
  ariaLabel: string,
  onSelect: () => void,
) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `vector-geo-node is-${status}${selected ? " is-selected" : ""}`;
  button.setAttribute("aria-label", ariaLabel);
  button.setAttribute("aria-pressed", String(selected));

  const pulse = document.createElement("span");
  pulse.className = "vector-geo-node-pulse";
  pulse.setAttribute("aria-hidden", "true");
  button.append(pulse);

  const copy = document.createElement("span");
  copy.className = "vector-geo-node-copy";

  const secondaryLocale = locale === "ar" ? "en" : "ar";
  const primaryName = document.createElement("span");
  primaryName.lang = locale;
  primaryName.dir = locale === "ar" ? "rtl" : "ltr";
  primaryName.className = locale === "ar" ? "font-arabic" : "";
  primaryName.textContent = name[locale];

  const separator = document.createElement("span");
  separator.className = "vector-geo-node-separator";
  separator.setAttribute("aria-hidden", "true");
  separator.textContent = "•";

  const secondaryName = document.createElement("span");
  secondaryName.lang = secondaryLocale;
  secondaryName.dir = secondaryLocale === "ar" ? "rtl" : "ltr";
  secondaryName.className = secondaryLocale === "ar" ? "font-arabic" : "";
  secondaryName.textContent = name[secondaryLocale];

  copy.append(primaryName, separator, secondaryName);
  button.append(copy);
  button.addEventListener("click", onSelect);

  return { button, dispose: () => button.removeEventListener("click", onSelect) };
}

export function MapLibreMapSurface({
  styleUrl,
  activeTravelRoute,
  camera,
  worldNodes,
  hotspots,
  level,
  reduceMotion,
  selectedDestinationId,
  selectedHotspotId,
  showRouteArc,
  onDestinationSelect,
  onHotspotSelect,
  onProviderError,
  onReady,
  onTravelComplete,
}: MapLibreMapSurfaceProps) {
  const { locale, t } = useUiPreferences();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyMapRef = useRef<maplibregl.Map | null>(null);
  const [styleRevision, setStyleRevision] = useState(0);
  const [initialLongitude, initialLatitude] = camera.center;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    let disposed = false;
    let providerReady = false;
    let stylePrepared = false;
    let map: maplibregl.Map;
    try {
      const testCanvas = document.createElement("canvas");
      if (!testCanvas.getContext("webgl2")) {
        onProviderError();
        return;
      }

      map = new maplibregl.Map({
        container,
        style: styleUrl,
        center: [initialLongitude, initialLatitude],
        zoom: camera.zoom,
        pitch: camera.pitch,
        bearing: camera.bearing,
        attributionControl: { compact: true },
        cooperativeGestures: false,
        fadeDuration: 300,
        maxZoom: 17.5,
        minZoom: level === "world" ? 1.4 : 8,
        canvasContextAttributes: { antialias: true },
      });
    } catch {
      onProviderError();
      return;
    }
    mapRef.current = map;

    const loadingTimeout = window.setTimeout(() => {
      if (!providerReady && !disposed) onProviderError();
    }, 12_000);

    const markProviderReady = () => {
      if (disposed || providerReady || !stylePrepared) return;
      providerReady = true;
      window.clearTimeout(loadingTimeout);
      readyMapRef.current = map;
      setStyleRevision((revision) => revision + 1);
      onReady();
    };

    const handleStyleLoad = () => {
      if (disposed) return;
      try {
        map.setProjection({ type: "mercator" });
        applyManaraMapPalette(map);

        if (level === "world") {
          map.fitBounds(
            [[-12, 10], [63, 39]],
            {
              padding: container.clientWidth < 700
                ? { top: 76, right: 28, bottom: Math.min(270, container.clientHeight * 0.4), left: 28 }
                : { top: 64, right: 54, bottom: 64, left: 54 },
              duration: 0,
              pitch: 0,
              bearing: 0,
            },
          );
        } else if (container.clientWidth < 520 && hotspots.length > 1) {
          const longitudes = hotspots.map((hotspot) => hotspot.coordinates[0]);
          const latitudes = hotspots.map((hotspot) => hotspot.coordinates[1]);
          map.fitBounds(
            [
              [Math.min(...longitudes), Math.min(...latitudes)],
              [Math.max(...longitudes), Math.max(...latitudes)],
            ],
            {
              padding: { top: 132, right: 44, bottom: 176, left: 44 },
              maxZoom: camera.zoom,
              duration: 0,
              pitch: Math.min(camera.pitch, 42),
              bearing: camera.bearing,
            },
          );
        }

        map.addSource(routeSourceId, {
          type: "geojson",
          lineMetrics: true,
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: `${routeSourceId}-glow`,
          type: "line",
          source: routeSourceId,
          paint: {
            "line-width": 6,
            "line-color": "#f5d98d",
            "line-opacity": 0.12,
            "line-blur": 5,
          },
        });
        map.addLayer({
          id: `${routeSourceId}-line`,
          type: "line",
          source: routeSourceId,
          paint: {
            "line-width": 2,
            "line-gradient": [
              "interpolate",
              ["linear"],
              ["line-progress"],
              0,
              "rgba(245,217,141,0)",
              0.18,
              "rgba(245,217,141,0.75)",
              1,
              "rgba(110,231,183,0.72)",
            ],
          },
        });

        stylePrepared = true;
        if (map.areTilesLoaded()) markProviderReady();
      } catch {
        onProviderError();
      }
    };

    const handleSourceData = (event: maplibregl.MapSourceDataEvent) => {
      if (event.sourceId === "openmaptiles" && event.isSourceLoaded) markProviderReady();
    };

    const handleIdle = () => markProviderReady();

    const handleError = (event: maplibregl.ErrorEvent) => {
      const message = event.error?.message?.toLowerCase() ?? "";
      if (!providerReady || message.includes("style") || message.includes("webgl") || message.includes("network") || message.includes("fetch")) {
        onProviderError();
      }
    };

    map.on("style.load", handleStyleLoad);
    map.on("sourcedata", handleSourceData);
    map.on("idle", handleIdle);
    map.on("error", handleError);

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container);

    return () => {
      disposed = true;
      window.clearTimeout(loadingTimeout);
      resizeObserver.disconnect();
      map.off("style.load", handleStyleLoad);
      map.off("sourcedata", handleSourceData);
      map.off("idle", handleIdle);
      map.off("error", handleError);
      map.stop();
      map.remove();
      if (readyMapRef.current === map) readyMapRef.current = null;
      mapRef.current = null;
    };
  }, [
    camera.bearing,
    camera.pitch,
    camera.zoom,
    initialLatitude,
    initialLongitude,
    hotspots,
    level,
    onProviderError,
    onReady,
    styleUrl,
  ]);

  useEffect(() => {
    const map = readyMapRef.current;
    if (!map || map !== mapRef.current || level !== "world") return;

    const data = {
      type: "FeatureCollection" as const,
      features: worldNodes.map((node) => ({
        type: "Feature" as const,
        properties: {
          id: node.id,
          title: node.name[locale],
          availability: node.availability,
          selected: node.id === selectedDestinationId,
          sortKey: 2_000 - getWorldNodePresentationPriority(node, selectedDestinationId),
        },
        geometry: { type: "Point" as const, coordinates: [...node.coordinates] },
      })),
    };

    const hitLayerId = `${worldSourceId}-hits`;
    const circleLayerId = `${worldSourceId}-circles`;
    const labelLayerId = `${worldSourceId}-labels`;
    const hoverLabelLayerId = `${worldSourceId}-hover-label`;
    const selectedLabelLayerId = `${worldSourceId}-selected-label`;

    try {
      const source = map.getSource(worldSourceId) as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(data);
      } else if (worldNodes.length > 0) {
        map.addSource(worldSourceId, { type: "geojson", data });
        map.addLayer({
          id: hitLayerId,
          type: "circle",
          source: worldSourceId,
          paint: { "circle-radius": 11, "circle-opacity": 0.01 },
        });
        map.addLayer({
          id: circleLayerId,
          type: "circle",
          source: worldSourceId,
          paint: {
            "circle-radius": ["case", ["get", "selected"], 7, ["==", ["get", "availability"], "available"], 5.5, 4.2],
            "circle-color": ["match", ["get", "availability"], "available", "#f3d889", "preview", "#d6b879", "#79d8b2"],
            "circle-opacity": ["case", ["get", "selected"], 1, 0.86],
            "circle-stroke-color": ["case", ["get", "selected"], "#fff1bd", "#e7e5e4"],
            "circle-stroke-opacity": ["case", ["get", "selected"], 0.9, 0.42],
            "circle-stroke-width": ["case", ["get", "selected"], 2.2, 1.1],
            "circle-blur": 0.08,
          },
        });
        map.addLayer({
          id: labelLayerId,
          type: "symbol",
          source: worldSourceId,
          filter: [
            "all",
            ["==", ["get", "selected"], false],
            ["match", ["get", "id"], ["destination-abu-dhabi", "destination-cairo"], true, false],
          ],
          layout: {
            "symbol-sort-key": ["get", "sortKey"],
            "text-field": ["get", "title"],
            "text-font": ["Noto Sans Regular"],
            "text-size": ["interpolate", ["linear"], ["zoom"], 2, 9, 4.5, 11.5],
            "text-variable-anchor": ["top", "right", "bottom", "left"],
            "text-radial-offset": 1.05,
            "text-justify": "auto",
            "text-padding": 5,
            "text-allow-overlap": false,
            "text-optional": true,
          },
          paint: {
            "text-color": ["match", ["get", "availability"], "available", "#fff1bd", "preview", "#e7d7aa", "#cdeee0"],
            "text-opacity": ["match", ["get", "availability"], "available", 0.98, "preview", 0.82, 0.75],
            "text-halo-color": "#07110e",
            "text-halo-width": 1.6,
          },
        });
        map.addLayer({
          id: hoverLabelLayerId,
          type: "symbol",
          source: worldSourceId,
          filter: ["==", ["get", "id"], ""],
          layout: {
            "text-field": ["get", "title"],
            "text-font": ["Noto Sans Regular"],
            "text-size": 11,
            "text-variable-anchor": ["top", "right", "bottom", "left"],
            "text-radial-offset": 1.1,
            "text-justify": "auto",
            "text-allow-overlap": true,
            "text-ignore-placement": true,
          },
          paint: {
            "text-color": "#fff1bd",
            "text-halo-color": "#07110e",
            "text-halo-width": 1.8,
          },
        });
        map.addLayer({
          id: selectedLabelLayerId,
          type: "symbol",
          source: worldSourceId,
          filter: ["==", ["get", "selected"], true],
          layout: {
            "text-field": ["get", "title"],
            "text-font": ["Noto Sans Regular"],
            "text-size": 12,
            "text-variable-anchor": ["top", "right", "bottom", "left"],
            "text-radial-offset": 1.15,
            "text-justify": "auto",
            "text-allow-overlap": true,
            "text-ignore-placement": true,
          },
          paint: {
            "text-color": "#fff6d8",
            "text-halo-color": "#07110e",
            "text-halo-width": 2,
          },
        });
      }
    } catch {
      onProviderError();
      return;
    }

    const markerAt = (event: maplibregl.MapMouseEvent) => resolveNearestMarkerId(
      worldNodes.map((node) => {
        const point = map.project(asLngLat(node.coordinates));
        return { id: node.id, x: point.x, y: point.y };
      }),
      { x: event.point.x, y: event.point.y },
      24,
    );
    const handleSelect = (event: maplibregl.MapMouseEvent) => {
      const id = markerAt(event);
      if (id) onDestinationSelect(id);
    };
    let hoveredMarkerId = "";
    const showPointer = (event: maplibregl.MapMouseEvent) => {
      map.getCanvas().style.cursor = "pointer";
      const nextId = markerAt(event) ?? "";
      if (nextId === hoveredMarkerId) return;
      hoveredMarkerId = nextId;
      map.setFilter(hoverLabelLayerId, ["==", ["get", "id"], hoveredMarkerId]);
    };
    const clearPointer = () => {
      map.getCanvas().style.cursor = "";
      hoveredMarkerId = "";
      map.setFilter(hoverLabelLayerId, ["==", ["get", "id"], ""]);
    };
    map.on("click", hitLayerId, handleSelect);
    map.on("mousemove", hitLayerId, showPointer);
    map.on("mouseleave", hitLayerId, clearPointer);

    return () => {
      map.off("click", hitLayerId, handleSelect);
      map.off("mousemove", hitLayerId, showPointer);
      map.off("mouseleave", hitLayerId, clearPointer);
    };
  }, [level, locale, onDestinationSelect, onProviderError, selectedDestinationId, styleRevision, worldNodes]);

  useEffect(() => {
    const map = readyMapRef.current;
    if (!map || map !== mapRef.current || level !== "city") return;

    const markers: maplibregl.Marker[] = [];
    const disposers: Array<() => void> = [];
    const markerRecords: Array<{
      button: HTMLButtonElement;
      hotspot: (typeof hotspots)[number];
    }> = [];

    for (const hotspot of hotspots) {
      const statusKey = hotspot.availability === "available"
        ? "map.nodeAria.available"
        : hotspot.availability === "preview"
          ? "map.nodeAria.preview"
          : "map.nodeAria.comingSoon";
      const marker = createMarkerButton(
        hotspot.name,
        hotspot.availability,
        hotspot.id === selectedHotspotId,
        locale,
        t(statusKey, { name: hotspot.name[locale] }),
        () => onHotspotSelect(hotspot.id),
      );
      markers.push(new maplibregl.Marker({ element: marker.button, anchor: "center" })
        .setLngLat(asLngLat(hotspot.coordinates))
        .addTo(map));
      markerRecords.push({ button: marker.button, hotspot });
      disposers.push(marker.dispose);
    }

    const applyCollision = () => {
      const container = map.getContainer();
      const placements = new Map(resolveMapLabelPlacements(
        markerRecords.map(({ hotspot }) => {
          const point = map.project(asLngLat(hotspot.coordinates));
          return {
            id: hotspot.id,
            x: point.x,
            y: point.y,
            labelLength: hotspot.name.en.length + hotspot.name.ar.length * 0.55,
            priority: hotspot.id === selectedHotspotId
              ? 2_000
              : hotspot.availability === "available" ? 850 : hotspot.availability === "preview" ? 520 : 400,
            selected: hotspot.id === selectedHotspotId,
          };
        }),
        {
          width: container.clientWidth,
          height: container.clientHeight,
          maxLabels: container.clientWidth < 520 ? 2 : container.clientWidth < 900 ? 3 : 5,
          insets: {
            top: container.clientWidth < 700 ? 112 : 90,
            right: 20,
            bottom: container.clientWidth < 1024 && selectedHotspotId ? Math.min(220, container.clientHeight * 0.36) : 34,
            left: 20,
          },
        },
      ).map((placement) => [placement.id, placement]));

      for (const { button, hotspot } of markerRecords) {
        const placement = placements.get(hotspot.id);
        const labelVisible = String(placement?.visible ?? false);
        const labelAnchor = placement?.anchor ?? "top";
        if (button.dataset.labelVisible !== labelVisible) button.dataset.labelVisible = labelVisible;
        if (button.dataset.labelAnchor !== labelAnchor) button.dataset.labelAnchor = labelAnchor;
      }
    };

    let collisionFrame: number | null = null;
    const scheduleCollision = () => {
      if (collisionFrame !== null) return;
      collisionFrame = requestAnimationFrame(() => {
        collisionFrame = null;
        applyCollision();
      });
    };

    applyCollision();
    map.on("move", scheduleCollision);
    map.on("resize", scheduleCollision);

    return () => {
      map.off("move", scheduleCollision);
      map.off("resize", scheduleCollision);
      if (collisionFrame !== null) cancelAnimationFrame(collisionFrame);
      for (const dispose of disposers) dispose();
      for (const marker of markers) marker.remove();
    };
  }, [hotspots, level, locale, onHotspotSelect, selectedHotspotId, styleRevision, t]);

  useEffect(() => {
    const map = readyMapRef.current;
    if (!map || map !== mapRef.current) return;

    const source = map.getSource(routeSourceId) as maplibregl.GeoJSONSource | undefined;
    const arc = showRouteArc && activeTravelRoute
      ? createGeographicArc(activeTravelRoute.id, activeTravelRoute.from.center, activeTravelRoute.to.center)
      : undefined;
    source?.setData(arc ?? { type: "FeatureCollection", features: [] });
  }, [activeTravelRoute, showRouteArc, styleRevision]);

  useEffect(() => {
    const map = readyMapRef.current;
    if (!map || map !== mapRef.current || !activeTravelRoute) return;

    const route = activeTravelRoute;
    let disposed = false;
    let secondLegStarted = false;
    const settle = () => {
      if (!disposed) onTravelComplete(route.id);
    };
    const watchdog = window.setTimeout(() => {
      if (disposed) return;
      map.stop();
      map.jumpTo({ center: asLngLat(route.to.center), zoom: route.to.zoom, pitch: route.to.pitch, bearing: route.to.bearing });
      settle();
    }, (reduceMotion ? route.reducedMotionDurationMs : route.durationMs) + 1_500);

    const finish = () => {
      window.clearTimeout(watchdog);
      settle();
    };

    const startFinalLeg = () => {
      if (disposed || secondLegStarted) return;
      secondLegStarted = true;
      map.once("moveend", finish);
      map.flyTo({
        center: asLngLat(route.to.center),
        zoom: route.to.zoom,
        pitch: route.to.pitch,
        bearing: route.to.bearing,
        duration: Math.max(1_500, route.durationMs - 650),
        curve: 1.35,
        speed: 0.92,
        easing: (time) => time < 0.5 ? 4 * time * time * time : 1 - Math.pow(-2 * time + 2, 3) / 2,
        essential: false,
      });
    };

    map.stop();
    if (reduceMotion) {
      map.once("moveend", finish);
      map.easeTo({
        center: asLngLat(route.to.center),
        zoom: Math.min(route.to.zoom, level === "world" ? 10.8 : 14.6),
        pitch: 0,
        bearing: 0,
        duration: route.reducedMotionDurationMs,
        essential: false,
      });
    } else if (level === "world") {
      map.once("moveend", startFinalLeg);
      map.easeTo({
        center: asLngLat(route.from.center),
        zoom: Math.min(4.1, Math.max(2.8, map.getZoom() + 0.55)),
        pitch: 0,
        bearing: route.originDestinationId ? -5 : 0,
        duration: 650,
        easing: (time) => 1 - Math.pow(1 - time, 3),
        essential: false,
      });
    } else {
      secondLegStarted = true;
      map.once("moveend", finish);
      map.flyTo({
        center: asLngLat(route.to.center),
        zoom: route.to.zoom,
        pitch: route.to.pitch,
        bearing: route.to.bearing,
        duration: route.durationMs,
        curve: 1.15,
        speed: 0.85,
        easing: (time) => 1 - Math.pow(1 - time, 3),
        essential: false,
      });
    }

    return () => {
      disposed = true;
      window.clearTimeout(watchdog);
      map.off("moveend", startFinalLeg);
      map.off("moveend", finish);
      map.stop();
    };
  }, [activeTravelRoute, level, onTravelComplete, reduceMotion, styleRevision]);

  return (
    <div
      ref={containerRef}
      className="vector-map"
      role="region"
      aria-label={t(level === "world" ? "map.worldAria" : "map.cityAria")}
    />
  );
}

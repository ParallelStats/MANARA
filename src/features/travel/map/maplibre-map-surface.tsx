"use client";

import * as maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

import { createGeographicArc } from "@/application/travel/create-geographic-arc";
import { getWorldNodePresentationPriority } from "@/application/travel/select-world-network-nodes";
import type { LocalizedText } from "@/domain/content/types";
import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";
import { createHotspotLandmarkElement } from "@/features/travel/map/hotspot-landmark";
import { resolveMapLabelPlacements } from "@/features/travel/map/label-collision";
import { hasRenderableMapBase } from "@/features/travel/map/map-readiness";
import {
  resolveNonOverlappingHitDiameters,
  shouldShowPersistentWorldLabel,
} from "@/features/travel/map/marker-interaction";
import type { ScenarioHotspot } from "@/domain/travel/types";
import type { MapSurfaceProps } from "@/features/travel/map/map-surface-types";
import type { UiLocale } from "@/i18n/ui-preferences";

interface MapLibreMapSurfaceProps extends MapSurfaceProps {
  readonly styleUrl: string;
  readonly onProviderError: () => void;
  readonly onReady: () => void;
}

const routeSourceId = "manara-travel-route";
const arabCountriesSourceId = "manara-arab-countries";

maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

function applyManaraMapPalette(map: maplibregl.Map, level: "city" | "world") {
  for (const layer of map.getStyle().layers ?? []) {
    const sourceLayer = (layer as { "source-layer"?: string })["source-layer"];
    const id = layer.id.toLowerCase();
    const isCountryLabel = id.includes("country");
    const isProviderPlaceLabel = sourceLayer === "place" && !isCountryLabel;
    const isProviderPoi = sourceLayer === "poi" || /(^|[-_])poi([-_]|$)/i.test(id);

    if (level === "world" && layer.type === "symbol" && (isProviderPlaceLabel || isProviderPoi)) {
      map.setLayoutProperty(layer.id, "visibility", "none");
      continue;
    }

    if (level === "city" && layer.type === "symbol" && isProviderPoi) {
      map.setLayoutProperty(layer.id, "visibility", "visible");
      if (layer.id === "poi_r1") map.setLayerZoomRange(layer.id, 13.1, 24);
    }

    if (layer.type === "background") {
      map.setPaintProperty(layer.id, "background-color", "#10241c");
      continue;
    }

    if (layer.type === "raster") {
      map.setPaintProperty(layer.id, "raster-opacity", 0.58);
      map.setPaintProperty(layer.id, "raster-saturation", -0.28);
      map.setPaintProperty(layer.id, "raster-contrast", 0.1);
      map.setPaintProperty(layer.id, "raster-brightness-min", 0.08);
      map.setPaintProperty(layer.id, "raster-brightness-max", 0.58);
      continue;
    }

    if (layer.type === "fill") {
      if (sourceLayer === "water") {
        map.setPaintProperty(layer.id, "fill-color", "#123d48");
        map.setPaintProperty(layer.id, "fill-opacity", 0.94);
      } else if (sourceLayer === "building") {
        map.setPaintProperty(layer.id, "fill-color", "#465249");
        map.setPaintProperty(layer.id, "fill-opacity", 0.88);
        if (level === "city" && layer.id === "building") {
          map.setLayerZoomRange(layer.id, 12.8, 14);
        }
      } else if (id.includes("park") || id.includes("wood") || id.includes("grass")) {
        map.setPaintProperty(layer.id, "fill-color", "#274a36");
        map.setPaintProperty(layer.id, "fill-opacity", 0.76);
      } else if (id.includes("sand")) {
        map.setPaintProperty(layer.id, "fill-color", "#5d4b32");
        map.setPaintProperty(layer.id, "fill-opacity", 0.72);
      } else if (sourceLayer === "landuse" || sourceLayer === "landcover") {
        map.setPaintProperty(layer.id, "fill-color", "#294332");
        map.setPaintProperty(layer.id, "fill-opacity", 0.7);
      }
      continue;
    }

    if (layer.type === "line") {
      if (sourceLayer === "boundary" || id.includes("boundary")) {
        map.setPaintProperty(layer.id, "line-color", "#d6bd79");
        map.setPaintProperty(layer.id, "line-opacity", id.includes("country") || id.includes("boundary_2") ? 0.82 : 0.4);
      } else if (sourceLayer === "transportation") {
        const majorRoad = /(motorway|trunk|primary|secondary)/.test(id);
        map.setPaintProperty(layer.id, "line-color", majorRoad ? "#d0aa6c" : "#8e8065");
        map.setPaintProperty(layer.id, "line-opacity", majorRoad ? 0.9 : 0.68);
      }
      continue;
    }

    if (level === "city" && layer.type === "symbol" && isProviderPoi) {
      map.setPaintProperty(layer.id, "text-color", "#ead8a4");
      map.setPaintProperty(layer.id, "text-halo-color", "#07110e");
      map.setPaintProperty(layer.id, "text-halo-width", 1.35);
    } else if (layer.type === "symbol" && sourceLayer === "place" && isCountryLabel) {
      map.setPaintProperty(layer.id, "text-color", "#ead8a4");
      map.setPaintProperty(layer.id, "text-halo-color", "#07110e");
      map.setPaintProperty(layer.id, "text-halo-width", 1.4);
    } else if (layer.type === "symbol" && sourceLayer === "water_name") {
      map.setPaintProperty(layer.id, "text-color", "#8fbfca");
      map.setPaintProperty(layer.id, "text-halo-color", "#07110e");
    }
  }
}

const arabCountryLayerIds = {
  fill: `${arabCountriesSourceId}-fill`,
  glow: `${arabCountriesSourceId}-border-glow`,
  border: `${arabCountriesSourceId}-border`,
} as const;

function addArabCountryHighlight(map: maplibregl.Map) {
  if (!map.getSource(arabCountriesSourceId)) {
    map.addSource(arabCountriesSourceId, {
      type: "geojson",
      data: "/data/arab-country-boundaries.geojson",
    });
  }
  if (!map.getLayer(arabCountryLayerIds.fill)) {
    map.addLayer({
      id: arabCountryLayerIds.fill,
      type: "fill",
      source: arabCountriesSourceId,
      paint: {
        "fill-color": [
          "match",
          ["get", "code"],
          ["ARE", "EGY"], "#23845a",
          ["MAR"], "#8a6935",
          "#2d684f",
        ],
        "fill-opacity": 0.44,
      },
    });
  }
  if (!map.getLayer(arabCountryLayerIds.glow)) {
    map.addLayer({
      id: arabCountryLayerIds.glow,
      type: "line",
      source: arabCountriesSourceId,
      paint: {
        "line-color": "#f5d98d",
        "line-width": ["interpolate", ["linear"], ["zoom"], 2, 3.5, 6, 6],
        "line-opacity": 0.26,
        "line-blur": 3,
      },
    });
  }
  if (!map.getLayer(arabCountryLayerIds.border)) {
    map.addLayer({
      id: arabCountryLayerIds.border,
      type: "line",
      source: arabCountriesSourceId,
      paint: {
        "line-color": "#f8dda0",
        "line-width": ["interpolate", ["linear"], ["zoom"], 2, 1.25, 6, 2.25],
        "line-opacity": 0.98,
      },
    });
  }
}

function raiseManaraLayers(map: maplibregl.Map) {
  const orderedIds = [
    arabCountryLayerIds.fill,
    `${routeSourceId}-glow`,
    `${routeSourceId}-line`,
    arabCountryLayerIds.glow,
    arabCountryLayerIds.border,
  ];
  for (const id of orderedIds) {
    if (map.getLayer(id)) map.moveLayer(id);
  }
}

function asLngLat(point: readonly [number, number]): [number, number] {
  return [point[0], point[1]];
}

function fitWorldNetworkBounds(map: maplibregl.Map, container: HTMLElement) {
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
}

function createMarkerButton(
  name: LocalizedText,
  status: string,
  selected: boolean,
  locale: UiLocale,
  ariaLabel: string,
  onSelect: () => void,
  hotspotKind?: ScenarioHotspot["kind"],
) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `vector-geo-node is-${status}${selected ? " is-selected" : ""}`;
  button.setAttribute("aria-label", ariaLabel);
  button.setAttribute("aria-pressed", String(selected));

  if (hotspotKind) {
    button.dataset.hotspotKind = hotspotKind;
    button.append(createHotspotLandmarkElement(hotspotKind));
  }

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
    let diagnosticsCaptured = false;
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
    }, 10_000);

    const hasReadableBaseMap = () => {
      const sources = Object.values(map.getStyle().sources ?? {});
      return hasRenderableMapBase(level, {
        styleLoaded: stylePrepared,
        hasRasterSource: sources.some(({ type }) => type === "raster"),
        hasVectorSource: sources.some(({ type }) => type === "vector"),
      });
    };

    const updateDevelopmentDiagnostics = () => {
      if (process.env.NODE_ENV !== "development" || diagnosticsCaptured) return;
      let vectorFeatureCount = 0;
      try {
        vectorFeatureCount = ["transportation", "building", "landuse", "water", "poi"]
          .reduce((total, sourceLayer) => total + map.querySourceFeatures(
            "openmaptiles",
            { sourceLayer },
          ).length, 0);
      } catch {
        vectorFeatureCount = 0;
      }
      container.dataset.mapTilesLoaded = String(map.areTilesLoaded());
      container.dataset.mapVectorFeatures = String(vectorFeatureCount);
      container.dataset.mapRenderedFeatures = String(map.queryRenderedFeatures().length);
      container.dataset.mapZoom = map.getZoom().toFixed(2);
      diagnosticsCaptured = true;
    };

    const markProviderReady = () => {
      if (disposed || providerReady || !stylePrepared || !hasReadableBaseMap()) return;
      providerReady = true;
      window.clearTimeout(loadingTimeout);
      readyMapRef.current = map;
      setStyleRevision((revision) => revision + 1);
      onReady();
    };

    const fitWorldBounds = () => {
      fitWorldNetworkBounds(map, container);
    };

    const handleStyleLoad = () => {
      if (disposed) return;
      try {
        map.setProjection({ type: "mercator" });
        applyManaraMapPalette(map, level);

        if (level === "world") {
          fitWorldBounds();
          addArabCountryHighlight(map);
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

        if (level === "world") raiseManaraLayers(map);

        stylePrepared = true;
        markProviderReady();
      } catch {
        onProviderError();
      }
    };

    const handleSourceData = (event: maplibregl.MapSourceDataEvent) => {
      if (event.sourceId === arabCountriesSourceId && level === "world") {
        raiseManaraLayers(map);
      }
      if (event.sourceId === "openmaptiles") markProviderReady();
    };

    const handleMissingStyleImage = (event: { id: string }) => {
      if (map.hasImage(event.id)) return;
      map.addImage(event.id, {
        width: 1,
        height: 1,
        data: new Uint8Array([0, 0, 0, 0]),
      });
    };

    const handleIdle = () => {
      updateDevelopmentDiagnostics();
      markProviderReady();
    };

    const handleError = (event: maplibregl.ErrorEvent) => {
      const message = event.error?.message?.toLowerCase() ?? "";
      if (process.env.NODE_ENV === "development") {
        container.dataset.mapError = message.slice(0, 240);
      }
      const fatalRendererError = message.includes("webgl") || message.includes("context lost");
      const fatalStyleError = !stylePrepared && (
        message.includes("style") || message.includes("network") || message.includes("fetch")
      );
      if (fatalRendererError || fatalStyleError) {
        onProviderError();
      }
    };

    map.on("style.load", handleStyleLoad);
    map.on("styleimagemissing", handleMissingStyleImage);
    map.on("sourcedata", handleSourceData);
    map.on("idle", handleIdle);
    map.on("error", handleError);

    let resizeFrame: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
      if (level !== "world" || resizeFrame !== null) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null;
        fitWorldBounds();
      });
    });
    resizeObserver.observe(container);

    return () => {
      disposed = true;
      window.clearTimeout(loadingTimeout);
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      map.off("style.load", handleStyleLoad);
      map.off("styleimagemissing", handleMissingStyleImage);
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

    map.resize();
    fitWorldNetworkBounds(map, map.getContainer());

    const markers: maplibregl.Marker[] = [];
    const disposers: Array<() => void> = [];
    const markerRecords: Array<{
      button: HTMLButtonElement;
      node: (typeof worldNodes)[number];
    }> = [];

    for (const node of worldNodes) {
      const statusKey = node.availability === "available"
        ? "map.nodeAria.available"
        : node.availability === "preview"
          ? "map.nodeAria.preview"
          : "map.nodeAria.comingSoon";
      const marker = createMarkerButton(
        node.name,
        node.availability,
        node.id === selectedDestinationId,
        locale,
        t(statusKey, { name: node.name[locale] }),
        () => onDestinationSelect(node.id),
      );
      marker.button.classList.add("world-map-node");
      marker.button.dataset.labelVisible = "false";
      markers.push(new maplibregl.Marker({ element: marker.button, anchor: "center" })
        .setLngLat(asLngLat(node.coordinates))
        .addTo(map));
      markerRecords.push({ button: marker.button, node });
      disposers.push(marker.dispose);
    }

    const applyWorldLayout = () => {
      const container = map.getContainer();
      const projectedMarkers = markerRecords.map(({ node }) => {
        const point = map.project(asLngLat(node.coordinates));
        return { node, point, marker: { id: node.id, x: point.x, y: point.y } };
      });
      const hitDiameters = resolveNonOverlappingHitDiameters(
        projectedMarkers.map(({ marker }) => marker),
      );
      const placements = new Map(resolveMapLabelPlacements(
        projectedMarkers.map(({ node, point }) => {
          return {
            id: node.id,
            x: point.x,
            y: point.y,
            labelLength: node.name.en.length + node.name.ar.length * 0.55,
            priority: getWorldNodePresentationPriority(node, selectedDestinationId),
            selected: node.id === selectedDestinationId,
          };
        }),
        {
          width: container.clientWidth,
          height: container.clientHeight,
          maxLabels: container.clientWidth < 640 ? 0 : 3,
          insets: {
            top: container.clientWidth < 700 ? 112 : 90,
            right: 20,
            bottom: container.clientWidth < 1024 && selectedDestinationId
              ? Math.min(230, container.clientHeight * 0.38)
              : 34,
            left: 20,
          },
        },
      ).map((placement) => [placement.id, placement]));

      for (const { button, node } of markerRecords) {
        const placement = placements.get(node.id);
        const hitSize = `${hitDiameters.get(node.id) ?? 32}px`;
        const labelVisible = String(Boolean(
          placement?.visible && shouldShowPersistentWorldLabel(
            node.id,
            selectedDestinationId,
            container.clientWidth,
          ),
        ));
        const labelAnchor = placement?.anchor ?? "top";
        if (button.style.getPropertyValue("--marker-hit-size") !== hitSize) {
          button.style.setProperty("--marker-hit-size", hitSize);
        }
        if (button.dataset.labelVisible !== labelVisible) {
          button.dataset.labelVisible = labelVisible;
        }
        if (button.dataset.labelAnchor !== labelAnchor) {
          button.dataset.labelAnchor = labelAnchor;
        }
      }
    };

    let layoutFrame: number | null = null;
    const scheduleWorldLayout = () => {
      if (layoutFrame !== null) return;
      layoutFrame = requestAnimationFrame(() => {
        layoutFrame = null;
        applyWorldLayout();
      });
    };

    applyWorldLayout();
    map.on("move", scheduleWorldLayout);
    map.on("resize", scheduleWorldLayout);

    return () => {
      map.off("move", scheduleWorldLayout);
      map.off("resize", scheduleWorldLayout);
      if (layoutFrame !== null) cancelAnimationFrame(layoutFrame);
      for (const dispose of disposers) dispose();
      for (const marker of markers) marker.remove();
    };
  }, [level, locale, onDestinationSelect, selectedDestinationId, styleRevision, t, worldNodes]);

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
        hotspot.kind,
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
        duration: Math.max(900, route.durationMs - 450),
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
        duration: 450,
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

"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createScenarioTravelRoute } from "@/application/travel/create-travel-route";
import { scenarioRoute } from "@/application/travel/routes";
import type { DestinationSummary } from "@/application/travel/select-destination-summaries";
import type { WorldNetworkNode } from "@/application/travel/select-world-network-nodes";
import { initialTravelTransitionState, travelTransitionReducer } from "@/application/travel/travel-transition";
import { BilingualName } from "@/components/i18n/bilingual-name";
import type { MapConfiguration } from "@/config/map";
import type { DestinationArrival, ScenarioHotspot, TravelRoute } from "@/domain/travel/types";
import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";
import { TravelOverlay } from "@/features/travel/components/travel-overlay";
import { GeographicMap } from "@/features/travel/map/geographic-map";
import { rememberDestinationVisit } from "@/state/travel-memory-repository";

interface CityExperienceProps {
  readonly arrival: DestinationArrival;
  readonly configuration: MapConfiguration;
  readonly destination: DestinationSummary;
  readonly hotspots: readonly ScenarioHotspot[];
}

const noWorldNodes: readonly WorldNetworkNode[] = [];

function ignoreDestinationSelection() {}

export function CityExperience({ arrival, configuration, destination, hotspots }: CityExperienceProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion() ?? false;
  const { direction, locale, t } = useUiPreferences();
  const [selectedHotspotId, setSelectedHotspotId] = useState("");
  const [transition, setTransition] = useState(initialTravelTransitionState);
  const [activeRoute, setActiveRoute] = useState<TravelRoute | null>(null);
  const activeRouteRef = useRef<TravelRoute | null>(null);
  const runningRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const selectedHotspot = useMemo(
    () => hotspots.find(({ id }) => id === selectedHotspotId),
    [hotspots, selectedHotspotId],
  );

  const dispatch = useCallback((action: Parameters<typeof travelTransitionReducer>[1]) => {
    setTransition((current) => travelTransitionReducer(current, action));
  }, []);

  useEffect(() => {
    rememberDestinationVisit(destination.id);
    headingRef.current?.focus({ preventScroll: true });
  }, [destination.id]);

  useEffect(() => {
    for (const hotspot of hotspots) {
      if (hotspot.availability === "available") router.prefetch(scenarioRoute(destination.slug, hotspot.slug));
    }
  }, [destination.slug, hotspots, router]);

  const selectHotspot = useCallback((hotspotId: string) => {
    if (runningRef.current) return;
    setSelectedHotspotId(hotspotId);
    dispatch({ type: "preview", targetId: hotspotId });
  }, [dispatch]);

  const completeTravel = useCallback((routeId: string) => {
    const route = activeRouteRef.current;
    if (!route || route.id !== routeId || !runningRef.current) return;
    const hotspot = hotspots.find(({ id }) => id === transition.targetId);
    if (!hotspot || hotspot.availability !== "available") return;

    const operationId = Number(route.id.split("-")[1]);
    dispatch({ type: "complete", operationId });
    runningRef.current = false;
    activeRouteRef.current = null;
    setActiveRoute(null);
    router.push(scenarioRoute(destination.slug, hotspot.slug));
  }, [destination.slug, dispatch, hotspots, router, transition.targetId]);

  const beginScenarioTravel = useCallback(() => {
    if (!selectedHotspot || selectedHotspot.availability !== "available" || runningRef.current) return;
    const operationId = transition.operationId + 1;
    const route = createScenarioTravelRoute(operationId, selectedHotspot, destination.dialect.id);
    if (!route) return;

    runningRef.current = true;
    activeRouteRef.current = route;
    dispatch({ type: "start", targetId: selectedHotspot.id });
    setActiveRoute(route);
  }, [destination.dialect.id, dispatch, selectedHotspot, transition.operationId]);

  const skipTravel = useCallback(() => {
    const route = activeRouteRef.current;
    if (!route) return;
    completeTravel(route.id);
  }, [completeTravel]);

  if (hotspots.length === 0) {
    return <div className="map-empty-state" role="status">{t("city.empty")}</div>;
  }

  const isTravelling = Boolean(activeRoute);

  return (
    <div className={`travel-workspace city-workspace city-${arrival.atmosphere}${selectedHotspot ? " has-selection" : " has-no-selection"}`}>
      <section
        className="geographic-stage"
        aria-labelledby="city-map-title"
        inert={isTravelling}
      >
        <div className="map-context-overlay">
          <p className="eyebrow">
            {t("city.arrivedIn", { city: destination.name[locale] })}
          </p>
          <h1 id="city-map-title" ref={headingRef} tabIndex={-1}>{t("city.title")}</h1>
          <p>{arrival.introduction[locale]}</p>
        </div>

        <GeographicMap
          activeTravelRoute={activeRoute}
          camera={arrival.cityCamera}
          configuration={configuration}
          worldNodes={noWorldNodes}
          hotspots={hotspots}
          level="city"
          reduceMotion={shouldReduceMotion}
          selectedHotspotId={selectedHotspot?.id}
          showRouteArc={false}
          onDestinationSelect={ignoreDestinationSelection}
          onHotspotSelect={selectHotspot}
          onTravelComplete={completeTravel}
        />
      </section>

      {selectedHotspot ? (
      <aside className="travel-panel hotspot-panel" aria-labelledby="selected-hotspot-title" aria-live="polite" inert={isTravelling}>
        <div className="sheet-handle" aria-hidden="true" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selectedHotspot.id}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -5 }}
            transition={{ duration: shouldReduceMotion ? 0.08 : 0.22 }}
          >
            <div className="panel-heading-row">
              <div>
                <p className="eyebrow">
                  {t(selectedHotspot.availability === "available"
                    ? "city.panel.ready"
                    : selectedHotspot.availability === "preview"
                      ? "city.panel.preview"
                      : "city.panel.comingSoon")}
                </p>
                <h2 id="selected-hotspot-title"><BilingualName name={selectedHotspot.name} /></h2>
              </div>
              <button type="button" className="panel-close focus-ring" aria-label={t("city.panel.close")} onClick={() => setSelectedHotspotId("")}>×</button>
            </div>
            <div className="mission-mini">
              <span>{t("city.panel.objective")}</span>
              <p>{selectedHotspot.objective[locale]}</p>
            </div>
            {selectedHotspot.availability === "available" ? (
              <button type="button" className="primary-action focus-ring w-full" disabled={transition.phase === "travelling"} onClick={beginScenarioTravel}>
                {t("city.action.enterPlace", { place: selectedHotspot.name[locale] })}
                <span aria-hidden="true">{direction === "rtl" ? "←" : "→"}</span>
              </button>
            ) : (
              <div className="unavailable-note">
                {t(selectedHotspot.availability === "preview"
                  ? "city.previewNote"
                  : "city.panel.comingSoon")}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <details className="hotspot-browser">
          <summary>{t("city.panel.otherPlaces", { city: destination.name[locale] })}</summary>
          <div
            className="hotspot-picker"
            aria-label={t("city.panel.locationsAria", { city: destination.name[locale] })}
          >
          {hotspots.map((hotspot) => {
            const secondaryLocale = locale === "ar" ? "en" : "ar";
            const statusKey = hotspot.availability === "available"
              ? "map.nodeAria.available"
              : hotspot.availability === "preview"
                ? "map.nodeAria.preview"
                : "map.nodeAria.comingSoon";

            return (
              <button
                key={hotspot.id}
                type="button"
                className="hotspot-choice focus-ring"
                aria-label={t(statusKey, { name: hotspot.name[locale] })}
                aria-pressed={hotspot.id === selectedHotspot.id}
                disabled={transition.phase === "travelling"}
                onClick={() => selectHotspot(hotspot.id)}
              >
                <span className={`hotspot-icon hotspot-icon-${hotspot.kind}`} aria-hidden="true" />
                <span>
                  <strong lang={locale} dir={direction}>{hotspot.name[locale]}</strong>
                  <small
                    lang={secondaryLocale}
                    dir={secondaryLocale === "ar" ? "rtl" : "ltr"}
                    className={secondaryLocale === "ar" ? "font-arabic" : undefined}
                  >
                    {hotspot.name[secondaryLocale]}
                  </small>
                </span>
                <em>
                  {t(hotspot.availability === "available"
                    ? "city.status.open"
                    : hotspot.availability === "preview"
                      ? "city.status.preview"
                      : "city.status.soon")}
                </em>
              </button>
            );
          })}
          </div>
        </details>
      </aside>
      ) : null}

      <AnimatePresence>
        {activeRoute && selectedHotspot ? (
          <TravelOverlay
            destinationName={`${destination.name[locale]} · ${selectedHotspot.name[locale]}`}
            level="scenario"
            onSkip={skipTravel}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

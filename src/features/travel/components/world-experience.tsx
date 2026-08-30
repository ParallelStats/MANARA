"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { selectTravelTransferContext } from "@/application/learning/select-travel-transfer-context";
import { createWorldTravelRoute } from "@/application/travel/create-travel-route";
import { cityRoute } from "@/application/travel/routes";
import {
  isEnterableWorldNetworkNode,
  type WorldNetworkNode,
} from "@/application/travel/select-world-network-nodes";
import { initialTravelTransitionState, travelTransitionReducer } from "@/application/travel/travel-transition";
import { BilingualName } from "@/components/i18n/bilingual-name";
import type { MapConfiguration } from "@/config/map";
import { worldCameraPreset } from "@/content/travel-experiences";
import type { LearnerProfile } from "@/domain/learning/types";
import type { ScenarioHotspot, TravelRoute } from "@/domain/travel/types";
import { useUiPreferences } from "@/features/preferences/ui-preferences-provider";
import { TravelOverlay } from "@/features/travel/components/travel-overlay";
import { GeographicMap } from "@/features/travel/map/geographic-map";
import { createLearnerProfileRepository } from "@/state/learner-profile-repository";
import { createMockLearnerProfile } from "@/state/mock-learner-profile";
import { readLastDestinationId, rememberDestinationVisit } from "@/state/travel-memory-repository";

interface WorldExperienceProps {
  readonly configuration: MapConfiguration;
  readonly worldNodes: readonly WorldNetworkNode[];
}

const noHotspots: readonly ScenarioHotspot[] = [];

function ignoreHotspotSelection() {}

export function WorldExperience({ configuration, worldNodes }: WorldExperienceProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion() ?? false;
  const { direction, locale, t, tp } = useUiPreferences();
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile>(() => createMockLearnerProfile());
  const [transition, dispatch] = useReducerSafe();
  const [activeRoute, setActiveRoute] = useState<TravelRoute | null>(null);
  const activeRouteRef = useRef<TravelRoute | null>(null);
  const runningRef = useRef(false);
  const networkDetailsRef = useRef<HTMLDetailsElement>(null);

  const selectedNode = useMemo(
    () => worldNodes.find(({ id }) => id === selectedNodeId),
    [selectedNodeId, worldNodes],
  );
  const enterableNodes = useMemo(
    () => worldNodes.filter(isEnterableWorldNetworkNode),
    [worldNodes],
  );

  useEffect(() => {
    let active = true;
    void createLearnerProfileRepository().load().then((profile) => {
      if (active) setLearnerProfile(profile);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    for (const destination of enterableNodes) router.prefetch(cityRoute(destination.slug));
  }, [enterableNodes, router]);

  const selectDestination = useCallback((nodeId: string) => {
    if (runningRef.current) return;
    setSelectedNodeId(nodeId);
    networkDetailsRef.current?.removeAttribute("open");
    dispatch({ type: "preview", targetId: nodeId });
  }, [dispatch]);

  const completeTravel = useCallback((routeId: string) => {
    const route = activeRouteRef.current;
    if (!route || route.id !== routeId || !runningRef.current) return;

    const destination = enterableNodes.find(({ id }) => id === route.targetDestinationId);
    if (!destination) {
      dispatch({
        type: "fail",
        operationId: transition.operationId + 1,
        message: t("world.error.routeIncomplete"),
      });
      runningRef.current = false;
      activeRouteRef.current = null;
      setActiveRoute(null);
      return;
    }

    const operationId = Number(route.id.split("-")[1]);
    dispatch({ type: "complete", operationId });
    rememberDestinationVisit(destination.id);
    runningRef.current = false;
    activeRouteRef.current = null;
    setActiveRoute(null);
    router.push(cityRoute(destination.slug));
  }, [dispatch, enterableNodes, router, t, transition.operationId]);

  const beginTravel = useCallback(() => {
    if (!isEnterableWorldNetworkNode(selectedNode) || runningRef.current) return;

    const previousId = readLastDestinationId();
    const origin = enterableNodes.find(({ id }) => id === previousId);
    const operationId = transition.operationId + 1;
    const route = createWorldTravelRoute({
      operationId,
      targetDestinationId: selectedNode.id,
      targetDialectId: selectedNode.dialect.id,
      transferContext: selectTravelTransferContext(learnerProfile, selectedNode.dialect.id),
      ...(origin && origin.id !== selectedNode.id ? { originDestinationId: origin.id } : {}),
    });
    if (!route) return;

    runningRef.current = true;
    activeRouteRef.current = route;
    dispatch({ type: "start", targetId: selectedNode.id });
    setActiveRoute(route);
  }, [dispatch, enterableNodes, learnerProfile, selectedNode, transition.operationId]);

  const skipTravel = useCallback(() => {
    const route = activeRouteRef.current;
    if (!route) return;

    const operationId = Number(route.id.split("-")[1]);
    dispatch({ type: "skip", operationId });
    completeTravel(route.id);
  }, [completeTravel, dispatch]);

  if (worldNodes.length === 0) {
    return (
      <div className="map-empty-state" role="status">
        <p className="eyebrow">{t("world.empty.title")}</p>
        <p className="mt-3 text-sm leading-6 text-secondary">{t("world.empty.body")}</p>
      </div>
    );
  }

  const routeHasOrigin = Boolean(
    activeRoute?.originDestinationId && activeRoute.originDestinationId !== activeRoute.targetDestinationId,
  );
  const isTravelling = Boolean(activeRoute);

  return (
    <div className={`travel-workspace world-workspace${selectedNode ? " has-selection" : " has-no-selection"}`}>
      <section className="geographic-stage" aria-labelledby="world-map-title" inert={isTravelling}>
        <div className="map-context-overlay">
          <p className="eyebrow">{t("world.kicker")}</p>
          <h1 id="world-map-title">{t("world.title")}</h1>
          <p>{t("world.description")}</p>
        </div>

        <GeographicMap
          activeTravelRoute={activeRoute}
          camera={worldCameraPreset}
          configuration={configuration}
          worldNodes={worldNodes}
          hotspots={noHotspots}
          level="world"
          reduceMotion={shouldReduceMotion}
          selectedDestinationId={selectedNode?.id}
          showRouteArc={routeHasOrigin}
          onDestinationSelect={selectDestination}
          onHotspotSelect={ignoreHotspotSelection}
          onTravelComplete={completeTravel}
        />

        <details ref={networkDetailsRef} className="network-browser">
          <summary>{tp("world.cityCount", worldNodes.length)}</summary>
          <div className="network-browser-list" aria-label={t("world.networkAria")}>
            {worldNodes.map((node) => {
              const statusKey = node.availability === "available"
                ? "map.nodeAria.available"
                : node.availability === "preview"
                  ? "map.nodeAria.preview"
                  : "map.nodeAria.comingSoon";

              return (
                <button
                  key={node.id}
                  type="button"
                  className="network-browser-choice focus-ring"
                  aria-label={t(statusKey, { name: node.name[locale] })}
                  aria-pressed={node.id === selectedNode?.id}
                  onClick={() => selectDestination(node.id)}
                >
                  <span>
                    <strong><BilingualName name={node.name} /></strong>
                    <small lang={locale} dir={direction}>{node.countryName[locale]}</small>
                  </span>
                  {node.availability === "available" ? (
                    <em>{t("world.status.open")}</em>
                  ) : node.availability === "preview" ? (
                    <em>{t("world.status.preview")}</em>
                  ) : null}
                </button>
              );
            })}
          </div>
        </details>
      </section>

      {selectedNode ? (
        <aside className="travel-panel destination-panel" aria-labelledby="selected-destination-title" aria-live="polite" inert={isTravelling}>
          <div className="sheet-handle" aria-hidden="true" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selectedNode.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -5 }}
              transition={{ duration: shouldReduceMotion ? 0.08 : 0.22 }}
            >
              <div className="panel-heading-row">
                <div>
                  <p className="eyebrow">
                    {t(selectedNode.availability === "available"
                      ? "world.panel.ready"
                      : selectedNode.availability === "preview"
                        ? "world.panel.preview"
                        : "world.panel.comingSoon")}
                  </p>
                  <h2 id="selected-destination-title"><BilingualName name={selectedNode.name} /></h2>
                  <p className="panel-location" lang={locale} dir={direction}>
                    {selectedNode.countryName[locale]}
                  </p>
                </div>
                <button type="button" className="panel-close focus-ring" aria-label={t("world.panel.close")} onClick={() => setSelectedNodeId("")}>×</button>
              </div>

              {selectedNode.availability === "available" && selectedNode.dialect.validationStatus === "verified" ? (
                <div className="dialect-focus">
                  <span>{t("world.panel.speechCommunityFocus")}</span>
                  <strong>
                    {selectedNode.dialect.id === "egyptian-cairo"
                      ? t("onboarding.variety.egyptian")
                      : selectedNode.dialect.id === "emirati-abu-dhabi"
                        ? t("onboarding.variety.emirati")
                        : selectedNode.dialect.label}
                  </strong>
                </div>
              ) : null}

              <p className="panel-description">
                {t(selectedNode.availability === "available"
                  ? "world.panel.description.available"
                  : selectedNode.availability === "preview"
                    ? "world.panel.description.preview"
                    : "world.panel.description.future")}
              </p>

              {selectedNode.availability === "available" ? (
                <button type="button" className="primary-action focus-ring w-full" disabled={transition.phase === "travelling"} onClick={beginTravel}>
                  {t("world.action.exploreCity", { city: selectedNode.name[locale] })}
                  <span aria-hidden="true">{direction === "rtl" ? "←" : "→"}</span>
                </button>
              ) : (
                <div className="unavailable-note" role="status">
                  {t(selectedNode.availability === "preview"
                    ? "world.previewNote"
                    : "world.panel.comingSoon")}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </aside>
      ) : null}

      <AnimatePresence>
        {activeRoute && selectedNode ? (
          <TravelOverlay destinationName={selectedNode.name[locale]} level="city" onSkip={skipTravel} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function useReducerSafe() {
  const [state, setState] = useState(initialTravelTransitionState);
  const dispatch = useCallback((action: Parameters<typeof travelTransitionReducer>[1]) => {
    setState((current) => travelTransitionReducer(current, action));
  }, []);
  return [state, dispatch] as const;
}

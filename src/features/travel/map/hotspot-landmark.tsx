import type { ScenarioHotspot } from "@/domain/travel/types";

type HotspotKind = ScenarioHotspot["kind"];

const landmarkPaths: Readonly<Record<HotspotKind, readonly string[]>> = {
  cafe: [
    "M5 8h10v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z",
    "M15 9h2a2.5 2.5 0 0 1 0 5h-2",
    "M4 19h15",
  ],
  campus: [
    "M3 9 12 4l9 5",
    "M5 10h14",
    "M6 10v7M10 10v7M14 10v7M18 10v7",
    "M4 18h16M3 20h18",
  ],
  majlis: [
    "M4 11 12 5l8 6",
    "M6 10v9h12v-9",
    "M9 19v-5h6v5",
  ],
  market: [
    "M4 9h16l-2-4H6L4 9Z",
    "M5 9v10h14V9",
    "M8 19v-6h8v6",
    "M4 9c1.4 2 2.8 2 4.2 0 1.3 2 2.7 2 4 0 1.4 2 2.8 2 4.2 0",
  ],
  transport: [
    "M5 16h14l-1.5-6h-11L5 16Z",
    "M7 10l1.5-3h7L17 10",
    "M7 16v2M17 16v2",
    "M8 13h.01M16 13h.01",
  ],
};

export function HotspotLandmarkIcon({ kind }: { readonly kind: HotspotKind }) {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      {landmarkPaths[kind].map((path) => <path key={path} d={path} />)}
    </svg>
  );
}

export function createHotspotLandmarkElement(kind: HotspotKind) {
  const namespace = "http://www.w3.org/2000/svg";
  const wrapper = document.createElement("span");
  wrapper.className = "hotspot-landmark";
  wrapper.setAttribute("aria-hidden", "true");

  const svg = document.createElementNS(namespace, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("focusable", "false");
  for (const pathData of landmarkPaths[kind]) {
    const path = document.createElementNS(namespace, "path");
    path.setAttribute("d", pathData);
    svg.append(path);
  }
  wrapper.append(svg);
  return wrapper;
}

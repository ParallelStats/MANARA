export const OPENFREEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

export type MapConfiguration = Readonly<{
  provider: "maplibre";
  styleUrl: typeof OPENFREEMAP_STYLE_URL;
}>;

export function resolveMapConfiguration(): MapConfiguration {
  return { provider: "maplibre", styleUrl: OPENFREEMAP_STYLE_URL };
}

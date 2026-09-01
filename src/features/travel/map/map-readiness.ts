export function hasRenderableMapBase(
  level: "city" | "world",
  availability: Readonly<{
    styleLoaded: boolean;
    hasRasterSource: boolean;
    hasVectorSource: boolean;
  }>,
) {
  if (!availability.styleLoaded) return false;
  return level === "city"
    ? availability.hasVectorSource
    : availability.hasVectorSource || availability.hasRasterSource;
}

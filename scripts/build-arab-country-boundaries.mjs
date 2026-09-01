import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const [inputPath, outputDirectory = "public/data"] = process.argv.slice(2);

if (!inputPath) {
  throw new Error("Usage: node scripts/build-arab-country-boundaries.mjs <natural-earth.geojson> [output-directory]");
}

const arabLeagueCountryCodes = new Set([
  "ARE", "BHR", "COM", "DJI", "DZA", "EGY", "IRQ", "JOR", "KWT", "LBN", "LBY",
  "MAR", "MRT", "OMN", "PSX", "QAT", "SAU", "SDN", "SOM", "SYR", "TUN", "YEM",
]);

const source = JSON.parse(await readFile(resolve(inputPath), "utf8"));
const features = source.features
  .filter((feature) => arabLeagueCountryCodes.has(feature.properties?.ADM0_A3))
  .map((feature) => ({
    type: "Feature",
    properties: {
      code: feature.properties.ADM0_A3,
      name: feature.properties.ADMIN,
    },
    geometry: feature.geometry,
  }));

if (features.length !== arabLeagueCountryCodes.size) {
  const found = new Set(features.map((feature) => feature.properties.code));
  const missing = [...arabLeagueCountryCodes].filter((code) => !found.has(code));
  throw new Error(`Natural Earth boundary source is missing: ${missing.join(", ")}`);
}

const outputRoot = resolve(outputDirectory);
await mkdir(outputRoot, { recursive: true });
await writeFile(
  resolve(outputRoot, "arab-country-boundaries.geojson"),
  `${JSON.stringify({
    type: "FeatureCollection",
    name: "MANARA Arab League country boundaries",
    source: "Natural Earth 1:50m Admin 0 Countries (public domain)",
    features,
  })}\n`,
  "utf8",
);

function projectedPoint([longitude, latitude]) {
  return [
    ((longitude + 15) / 80) * 100,
    22 + ((39 - latitude) / 29) * 42,
  ];
}

function ringPath(ring) {
  return ring.map((point, index) => {
    const [x, y] = projectedPoint(point);
    return `${index === 0 ? "M" : "L"}${x.toFixed(3)} ${y.toFixed(3)}`;
  }).join(" ") + " Z";
}

function geometryPath(geometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.flatMap((polygon) => polygon.map(ringPath)).join(" ");
}

const paths = features.map((feature) => {
  const fill = ["ARE", "EGY"].includes(feature.properties.code)
    ? "#23845a"
    : feature.properties.code === "MAR" ? "#8a6935" : "#2d684f";
  return `  <path data-country="${feature.properties.code}" fill="${fill}" d="${geometryPath(feature.geometry)}"/>`;
}).join("\n");

await writeFile(
  resolve(outputRoot, "arab-country-boundaries.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">\n` +
  `  <g fill-opacity="0.42" stroke="#f5d98d" stroke-opacity="0.94" stroke-width="0.2" vector-effect="non-scaling-stroke" fill-rule="evenodd">\n` +
  `${paths}\n  </g>\n</svg>\n`,
  "utf8",
);

console.log(`Created Arab-country map assets with ${features.length} boundaries.`);

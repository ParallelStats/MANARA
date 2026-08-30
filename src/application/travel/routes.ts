import type { Route } from "next";

export function worldRoute(): Route {
  return "/map";
}

export function cityRoute(destinationSlug: string): Route {
  return `/map/${encodeURIComponent(destinationSlug)}` as Route;
}

export function scenarioRoute(destinationSlug: string, scenarioSlug: string): Route {
  return `/map/${encodeURIComponent(destinationSlug)}/${encodeURIComponent(scenarioSlug)}` as Route;
}

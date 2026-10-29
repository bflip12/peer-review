import { getRouteName } from "./getRouteName.ts";

/** One page to capture: the route as given, its full URL, and the file name prefix. */
export type ScreenshotTargetT = { route: string; url: string; name: string };

/**
 * Validates the routes from the command line and pairs each with its URL and file name.
 * Throws when no route is given, when a route does not start with `/` (a full URL is
 * refused, since the base URL comes from the environment), or when two routes would save
 * to the same file. A repeated route is captured once.
 */
export const getScreenshotTargets = (
  routes: string[],
  baseUrl: string
): ScreenshotTargetT[] => {
  const uniqueRoutes = [...new Set(routes.map((route) => route.trim()))].filter(
    (route) => route !== ""
  );
  if (uniqueRoutes.length === 0) {
    throw new Error("Give at least one route, for example: npm run screenshot -- /");
  }

  const targets: ScreenshotTargetT[] = [];
  for (const route of uniqueRoutes) {
    if (!route.startsWith("/")) {
      throw new Error(`Route "${route}" must start with /.`);
    }
    const name = getRouteName(route);
    const clash = targets.find((target) => target.name === name);
    if (clash) {
      throw new Error(`Routes ${clash.route} and ${route} would both save as ${name}.`);
    }
    targets.push({ route, url: new URL(route, baseUrl).toString(), name });
  }
  return targets;
};

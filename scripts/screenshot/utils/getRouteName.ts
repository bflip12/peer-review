/**
 * Turns a route into a file name: `/` is `home`, and `/venues/abc` is `venues-abc`. Query
 * strings become part of the name. Anything but letters, digits, `-`, and `_` becomes a
 * dash, so two routes that differ only in those characters get the same name.
 */
export const getRouteName = (route: string): string => {
  const name = route
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return name === "" ? "home" : name;
};

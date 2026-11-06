/**
 * The highlighted option after an arrow key in a list of `count` options, or -1 for
 * none. Down from none goes to the first, up from none to the last, and both wrap. An
 * empty list has no highlight.
 */
export const getNextOptionIndex = (
  current: number,
  { count, key }: { count: number; key: "ArrowDown" | "ArrowUp" }
): number => {
  if (count === 0) {
    return -1;
  }
  if (key === "ArrowDown") {
    return current < 0 || current >= count - 1 ? 0 : current + 1;
  }
  return current <= 0 || current >= count ? count - 1 : current - 1;
};

const HEX_COLOR = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

// WCAG 2.x: channel values at or below this are on the linear part of the sRGB curve.
const SRGB_LINEAR_THRESHOLD = 0.03928;

/**
 * Relative luminance of a six-digit hex color, from 0 (black) to 1 (white). The numbers
 * are the WCAG 2.x definition of relative luminance, written as the spec gives them.
 */
const getLuminance = (color: string): number => {
  const match = HEX_COLOR.exec(color.trim());
  if (!match) {
    throw new Error(`"${color}" is not a six-digit hex color`);
  }

  const [red, green, blue] = match.slice(1).map((hex) => {
    const channel = parseInt(hex, 16) / 255;
    return channel <= SRGB_LINEAR_THRESHOLD
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

/**
 * The WCAG 2.x contrast ratio between two colors, from 1 to 21.
 *
 * Takes six-digit hex colors only (`#191816`), since that is how the token file writes
 * them. Throws on anything else rather than guessing, so a token written another way
 * fails the contrast test instead of passing it unchecked.
 */
export const getContrastRatio = (colorA: string, colorB: string): number => {
  const luminances = [getLuminance(colorA), getLuminance(colorB)];
  const lighter = Math.max(...luminances);
  const darker = Math.min(...luminances);

  return (lighter + 0.05) / (darker + 0.05);
};

import { HexColor } from "src/configuration/types";

const colorPatterns = {
  hex: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  rgb: /^rgb\(\s*(\d{1,3}%?)\s*,\s*(\d{1,3}%?)\s*,\s*(\d{1,3}%?)\s*\)$/,
  rgba: /^rgba\(\s*(\d{1,3}%?)\s*,\s*(\d{1,3}%?)\s*,\s*(\d{1,3}%?)\s*,\s*([01]?\.\d+)\s*\)$/,
  hsl: /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3}%)\s*,\s*(\d{1,3}%)\s*\)$/,
  hsla: /^hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3}%)\s*,\s*(\d{1,3}%)\s*,\s*([01]?\.\d+|\d{1,3}%?)\s*\)$/,
};

export const isColor = (content: string) => {
  return Object.entries(colorPatterns).find(([_, pattern]) =>
    pattern.test(content.trim()),
  );
}

export const isHexColor = (val: unknown): val is HexColor => {
  return typeof val === 'string' && colorPatterns.hex.test(val);
};

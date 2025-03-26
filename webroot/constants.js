export const resourceRatios = {
  CARBON: 10,
  NICKEL: 8,
  IRON: 5,
  GOLD: 4,
  PLATINUM: 0.6,
};

export const TOOL_SETTINGS = {
  shovel: {
    sparkDuration: 3.0,
    explosionDuration: 3.0,
    explosionSize: 0.3,
    cursor: "crosshair",
  },
  dynamite: {
    sparkDuration: 8.0,
    explosionDuration: 4.0,
    explosionSize: 0.5,
    cursor: "crosshair",
  },
};

export const qualities = [
  { name: "Low", bloom: false, ssao: false, shadows: false },
  { name: "Medium", bloom: true, ssao: false, shadows: true },
  { name: "High", bloom: true, ssao: true, shadows: true },
];

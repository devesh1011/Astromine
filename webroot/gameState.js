import { getRandomAsteroidConfig } from "./asteroid.js";

export const resources = {
  CARBON: 0,
  NICKEL: 0,
  IRON: 0,
  GOLD: 0,
  PLATINUM: 0,
};

export let currentTool = "shovel";
export let autoRotate = true;
export let dustExplosions = [];
export let gameStarted = true; // Export gameStarted

export let currentAsteroidConfig = getRandomAsteroidConfig();

import * as THREE from "./libs/three.module.js";
import { OrbitControls } from "./libs/jsm/controls/OrbitControls.js";
import { createProceduralAsteroid } from "./asteroid.js";
import { setupLighting } from "./lighting.js";

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
export const renderer = new THREE.WebGLRenderer({ antialias: true });
export const controls = new OrbitControls(camera, renderer.domElement);
export const modelGroup = new THREE.Group();

export function initializeScene() {
  camera.position.set(8, 3, 8);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  // Create the asteroid and add it to modelGroup
  const asteroid = createProceduralAsteroid(modelGroup); // Pass modelGroup
  console.log(asteroid)
  if (scene.add(modelGroup)) {
    console.log("Asteroid created and added to the scene"); // Debugging log
  }
  modelGroup.add(asteroid);

  setupLighting();
}

export function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

import { scene } from "./scene.js";
import * as THREE from "./libs/three.module.js";

export function setupLighting() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
  sunLight.position.set(5, 3, 5);
  sunLight.castShadow = true;
  scene.add(ambientLight, sunLight);
}

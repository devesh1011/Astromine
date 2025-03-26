import {
  initializeScene,
  scene,
  renderer,
  onWindowResize,
  camera,
  modelGroup,
} from "./scene.js";
import { createScoreCard, updateScoreCard, createToolSelector } from "./ui.js";
import { loadSound, playSound } from "./sound.js";
import { setupInteraction } from "./game.js";
// import { currentAsteroidConfig } from "./gameState.js";
import * as THREE from "./libs/three.module.js";
import {createProceduralAsteroid} from './asteroid.js'

let clock = new THREE.Clock();

async function init() {
  const loadingContainer = document.getElementById("loadingContainer");
  const loadingProgress = document.getElementById("loadingProgress");
  const loadingText = document.getElementById("loadingText");

  try {
    // Initialize scene first
    initializeScene(); // This should include camera.lookAt(0,0,0)

    // Show loading progress
    loadingProgress.style.width = "10%";
    loadingText.textContent = "Creating asteroid...";

    // Generate asteroid
    // currentAsteroidConfig = getRandomAsteroidConfig();
    const asteroid = createProceduralAsteroid(modelGroup);

    // Update UI
    loadingProgress.style.width = "70%";
    loadingText.textContent = "Setting up environment...";
    createScoreCard();
    createToolSelector();

    // Load assets
    await Promise.all([
      loadSound("shovel.mp3", "shovel"),
      loadSound("explosion.mp3", "explosion"),
    ]);

    // Final setup
    setupInteraction();
    animate();

    // Hide loading screen
    loadingProgress.style.width = "100%";
    loadingText.textContent = "Complete!";
    setTimeout(() => {
      loadingContainer.style.display = "none";
    }, 1000);
  } catch (error) {
    console.error("Initialization failed:", error);
    // Fallback asteroid
    modelGroup.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(2, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
      )
    );
    loadingContainer.style.display = "none";
    animate();
  }
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

window.addEventListener("resize", onWindowResize);
window.initAsteroid = init;

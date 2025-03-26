import * as THREE from './libs/three.module.js'; // Import THREE
import { scene, camera, modelGroup } from './scene.js'; // Import modelGroup
import { DustExplosion } from './particles.js';
import { currentTool, dustExplosions, gameStarted } from './gameState.js'; // Import gameStarted

export function setupInteraction() {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // Add custom cursor styles to head
  const style = document.createElement('style');
  style.textContent = `
    .shovel-cursor {
      cursor: crosshair;
    }
  `;
  document.head.appendChild(style);

  // Track if we're hovering over the asteroid
  let isHovering = false;

  // Mouse move event for hover detection
  window.addEventListener('mousemove', (event) => {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(modelGroup.children, true);

    if (intersects.length > 0 && !isHovering) {
      // Mouse is over the asteroid - change to tool cursor
      document.body.classList.add('shovel-cursor');
      isHovering = true;
    } else if (intersects.length === 0 && isHovering) {
      // Mouse is no longer over the asteroid - change back to default cursor
      document.body.classList.remove('shovel-cursor');
      isHovering = false;
    }
  });

  // Click event for dust explosion
  window.addEventListener('click', (event) => {
    if (!gameStarted) return;

    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(modelGroup.children, true);

    if (intersects.length > 0) {
      // Create a dust explosion at the clicked point
      const intersectionPoint = intersects[0].point;

      // Create and add dust explosion with the current tool
      const explosion = new DustExplosion(intersectionPoint, scene, currentTool);
      dustExplosions.push(explosion);
    }
  });

  // Make sure cursor resets when leaving the window
  window.addEventListener('mouseleave', () => {
    if (isHovering) {
      document.body.classList.remove('shovel-cursor');
      isHovering = false;
    }
  });
}